import axios from 'axios';
import * as cheerio from 'cheerio';
import prisma from '../config/db.js';
import { TOPIC_MAPPING } from './analyticsService';

const DIFFICULTY_POINTS = {
    Easy: 1,
    Medium: 3,
    Hard: 5
};

const STREAK_BONUS = 50; // Bonus for 7-day streak

export const extractUsername = (url: string, platform: string): string | null => {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p !== '');

        switch (platform) {
            case 'leetcode':
                if (pathParts[0] === 'u') return pathParts[1] || null;
                return pathParts[0] || null;
            case 'codechef':
                // Handles https://www.codechef.com/users/username
                if (pathParts.includes('users')) return pathParts[pathParts.indexOf('users') + 1] || null;
                return pathParts[0] || null;
            case 'codeforces':
                // Handles https://codeforces.com/profile/username
                if (pathParts.includes('profile')) return pathParts[pathParts.indexOf('profile') + 1] || null;
                return pathParts[0] || null;
            case 'gfg':
                // Handles https://www.geeksforgeeks.org/user/username/
                if (pathParts.includes('user')) return pathParts[pathParts.indexOf('user') + 1] || null;
                return pathParts[0] || null;
            case 'hackerrank':
                // Handles https://www.hackerrank.com/profile/username
                if (pathParts.includes('profile')) return pathParts[pathParts.indexOf('profile') + 1] || null;
                return pathParts[0] || null;
            default:
                return null;
        }
    } catch (e) {
        return null;
    }
};

export const syncUserData = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const platforms = [
        { name: 'leetcode', url: user.leetcodeUrl },
        { name: 'codechef', url: user.codechefUrl },
        { name: 'codeforces', url: user.codeforcesUrl },
        { name: 'gfg', url: user.gfgUrl },
        { name: 'hackerrank', url: user.hackerrankUrl },
    ];

    let totalPoints = 0;
    const platformStats: any = {};
    const individualPoints: Record<string, number> = {
        leetcode: 0,
        codechef: 0,
        codeforces: 0,
        gfg: 0,
        hackerrank: 0
    };
    const topicStats: Record<string, number> = {};

    // Fetch all platforms IN PARALLEL instead of sequentially — major speed boost
    const platformFetchResults = await Promise.all(
        platforms.map(async (p) => {
            if (!p.url) return { name: p.name, stats: null };
            const username = extractUsername(p.url, p.name);
            if (!username) return { name: p.name, stats: null };
            const stats = await fetchPlatformStats(username, p.name);
            return { name: p.name, stats };
        })
    );

    // Get current aggregated stats to fall back on if ALL scrapes fail, 
    // or we can just fall back individually per platform.
    const currentStats = await prisma.stats.findUnique({ where: { userId } });

    const aggregatedStats = {
        totalSolved: 0,
        easy: 0,
        medium: 0,
        hard: 0,
    };

    let anyScrapeFailed = false;

    let leetcodeRecentSubmissions: any[] = currentStats?.recentSubmission ? (currentStats.recentSubmission as any[]) : [];

    for (const { name, stats } of platformFetchResults) {
        if (!stats) {
            anyScrapeFailed = true;
            // Scrape failed or no URL. Use EXISTING points from DB for this platform.
            let existingPoints = 0;
            if (name === 'leetcode') existingPoints = user.leetcodePoints;
            if (name === 'codechef') existingPoints = user.codechefPoints;
            if (name === 'codeforces') existingPoints = user.codeforcesPoints;
            if (name === 'gfg') existingPoints = user.gfgPoints;
            if (name === 'hackerrank') existingPoints = user.hackerrankPoints;

            individualPoints[name] = existingPoints || 0;
            totalPoints += existingPoints || 0;
            platformStats[name] = { failed: true, message: 'Could not fetch data' };
            continue;
        }

        platformStats[name] = stats;

        let pPoints = 0;
        if (name === 'hackerrank') {
            // hackerrank points are calculated independently from badges
            pPoints = stats.totalPoints || 0;
        } else {
            pPoints = (stats.easy * DIFFICULTY_POINTS.Easy) +
                (stats.medium * DIFFICULTY_POINTS.Medium) +
                (stats.hard * DIFFICULTY_POINTS.Hard);
        }

        individualPoints[name] = pPoints;
        totalPoints += pPoints;

        // Aggregate stats
        aggregatedStats.totalSolved += stats.totalSolved || 0;
        aggregatedStats.easy += stats.easy || 0;
        aggregatedStats.medium += stats.medium || 0;
        aggregatedStats.hard += stats.hard || 0;

        if (name === 'leetcode' && (stats as any).recentSubmissions && (stats as any).recentSubmissions.length > 0) {
            leetcodeRecentSubmissions = (stats as any).recentSubmissions;
        }

        // Aggregate topic stats
        if (stats.topics) {
            const mappedPlatformTopics: Record<string, number> = {};
            Object.entries(stats.topics).forEach(([topic, count]: [string, any]) => {
                const standardTopic = TOPIC_MAPPING[topic.toLowerCase()] || topic;
                mappedPlatformTopics[standardTopic] = Math.max(mappedPlatformTopics[standardTopic] || 0, count);
            });
            Object.entries(mappedPlatformTopics).forEach(([topic, count]) => {
                topicStats[topic] = (topicStats[topic] || 0) + count;
            });
        }
    }

    // If ANY scrape failed, fallback to existing DB counts so we don't wipe aggregated stats based on a partial scrape
    if (anyScrapeFailed && currentStats) {
        aggregatedStats.totalSolved = Math.max(aggregatedStats.totalSolved, currentStats.totalSolved);
        aggregatedStats.easy = Math.max(aggregatedStats.easy, currentStats.easySolved);
        aggregatedStats.medium = Math.max(aggregatedStats.medium, currentStats.mediumSolved);
        aggregatedStats.hard = Math.max(aggregatedStats.hard, currentStats.hardSolved);
    }


    // Calculate streak from recent submissions real logic
    let newStreak = user.dailyStreak;
    let newLastStreakDate = user.lastStreakDate;
    let newLongestStreak = user.longestStreak || 0;

    if (leetcodeRecentSubmissions.length > 0) {
        const accepted = leetcodeRecentSubmissions.filter((sub: any) => sub.statusDisplay === 'Accepted');
        const dates = accepted.map((sub: any) => {
            const date = new Date(parseInt(sub.timestamp) * 1000);
            return date.toISOString().split('T')[0];
        });
        
        // Remove duplicates and Sort descending
        const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        const todayDate = new Date();
        const todayStr = todayDate.toISOString().split('T')[0];
        const yesterdayDate = new Date(todayDate);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

        let calculatedStreak = 0;
        let activeIndex = -1;

        if (uniqueDates.includes(todayStr)) {
            activeIndex = uniqueDates.indexOf(todayStr);
        } else if (uniqueDates.includes(yesterdayStr)) {
            activeIndex = uniqueDates.indexOf(yesterdayStr);
        }

        if (activeIndex !== -1) {
            calculatedStreak = 1;
            let checkDateStr = uniqueDates[activeIndex];
            
            for (let i = activeIndex + 1; i < uniqueDates.length; i++) {
                const checkDate = new Date(checkDateStr);
                checkDate.setDate(checkDate.getDate() - 1);
                const expectedStr = checkDate.toISOString().split('T')[0];
                
                if (uniqueDates[i] === expectedStr) {
                    calculatedStreak++;
                    checkDateStr = expectedStr;
                } else {
                    break;
                }
            }
        }
        
        newStreak = calculatedStreak;
        if (activeIndex !== -1) {
            newLastStreakDate = new Date(uniqueDates[activeIndex]);
        } else if (uniqueDates.length > 0) {
            // User solved things recently, but streak is 0 (last active date was before yesterday)
            newLastStreakDate = new Date(uniqueDates[0]); 
        }

        if (newStreak > newLongestStreak) {
            newLongestStreak = newStreak;
        }
    }

    if (newStreak >= 7) totalPoints += STREAK_BONUS;

    // Update user in DB with aggregated points and topic insights
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            totalPoints,
            dailyStreak: newStreak,
            longestStreak: newLongestStreak,
            lastStreakDate: newLastStreakDate,
            // @ts-ignore
            leetcodePoints: individualPoints.leetcode,
            // @ts-ignore
            codechefPoints: individualPoints.codechef,
            // @ts-ignore
            codeforcesPoints: individualPoints.codeforces,
            // @ts-ignore
            gfgPoints: individualPoints.gfg,
            // @ts-ignore
            hackerrankPoints: individualPoints.hackerrank,
            // @ts-ignore - topicStats is defined in schema.prisma 
            topicStats: topicStats as any,
            // Update or Create Stats record
            stats: {
                upsert: {
                    create: {
                        totalSolved: aggregatedStats.totalSolved,
                        easySolved: aggregatedStats.easy,
                        mediumSolved: aggregatedStats.medium,
                        hardSolved: aggregatedStats.hard,
                        recentSubmission: leetcodeRecentSubmissions
                    },
                    update: {
                        totalSolved: aggregatedStats.totalSolved,
                        easySolved: aggregatedStats.easy,
                        mediumSolved: aggregatedStats.medium,
                        hardSolved: aggregatedStats.hard,
                        recentSubmission: leetcodeRecentSubmissions
                    }
                }
            }
        }
    });

    return {
        totalPoints: updatedUser.totalPoints,
        platformStats,
        topicStats
    };
};

// Real fetcher logic
async function fetchPlatformStats(username: string, platform: string) {
    try {
        if (platform === 'hackerrank') {
            try {
                const response = await axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                const stats = {
                    easy: 0,
                    medium: 0,
                    hard: 0,
                    totalSolved: 0,
                    topics: {} as Record<string, number>,
                    totalPoints: 0
                };

                if (response.data && response.data.models) {
                    response.data.models.forEach((badge: any) => {
                        stats.totalPoints += (badge.current_points || 0);
                        stats.totalSolved += (badge.solved || 0);
                    });
                }

                return stats;
            } catch (e) {
                console.error('HackerRank Fetch Error:', e);
            }
        }

        if (platform === 'leetcode') {
            const query = `
                query userProblemsSolved($username: String!) {
                    matchedUser(username: $username) {
                        submitStats {
                            acSubmissionNum {
                                difficulty
                                count
                            }
                        }
                        tagProblemCounts {
                            fundamental { tagName problemsSolved }
                            intermediate { tagName problemsSolved }
                            advanced { tagName problemsSolved }
                        }
                    }
                    recentSubmissionList(username: $username, limit: 50) {
                        title
                        titleSlug
                        timestamp
                        statusDisplay
                        lang
                    }
                }
            `;
            const response = await axios.post('https://leetcode.com/graphql', {
                query,
                variables: { username }
            }, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://leetcode.com/'
                }
            });

            const data = response.data.data.matchedUser;
            const recentSubmissions = response.data.data.recentSubmissionList;

            if (!data) return null;

            const solved = data.submitStats.acSubmissionNum;
            const totalSolved = solved.find((s: any) => s.difficulty === 'All')?.count || 0;

            const stats = {
                easy: solved.find((s: any) => s.difficulty === 'Easy')?.count || 0,
                medium: solved.find((s: any) => s.difficulty === 'Medium')?.count || 0,
                hard: solved.find((s: any) => s.difficulty === 'Hard')?.count || 0,
                totalSolved,
                topics: {} as Record<string, number>,
                recentSubmissions: recentSubmissions || [],
                totalPoints: 0
            };

            // Process tags
            if (data.tagProblemCounts) {
                const processTags = (tags: any[]) => {
                    tags.forEach((t: any) => {
                        stats.topics[t.tagName] = (stats.topics[t.tagName] || 0) + t.problemsSolved;
                    });
                };
                processTags(data.tagProblemCounts.fundamental || []);
                processTags(data.tagProblemCounts.intermediate || []);
                processTags(data.tagProblemCounts.advanced || []);
            }
            return stats;
        }

        if (platform === 'codeforces') {
            try {
                const response = await axios.get(`https://codeforces.com/api/user.status?handle=${username}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                if (response.data.status === 'OK') {
                    const submissions = response.data.result;
                    const solved = submissions.filter((s: any) => s.verdict === 'OK');
                    const topics: Record<string, number> = {};

                    solved.forEach((s: any) => {
                        if (s.problem.tags) {
                            s.problem.tags.forEach((tag: string) => {
                                topics[tag] = (topics[tag] || 0) + 1;
                            });
                        }
                    });

                    // Simple difficulty mapping for CF
                    // In real app, we'd fetch problem details to get rating-based difficulty
                    return {
                        easy: solved.filter((s: any) => s.problem.rating && s.problem.rating <= 1200).length,
                        medium: solved.filter((s: any) => s.problem.rating && s.problem.rating > 1200 && s.problem.rating <= 1900).length,
                        hard: solved.filter((s: any) => s.problem.rating && s.problem.rating > 1900).length,
                        totalSolved: solved.length,
                        topics: topics,
                        totalPoints: 0
                    };
                }
            } catch (e) {
                console.error('CodeForces Fetch Error:', e);
            }
        }

        if (platform === 'codechef') {
            try {
                const response = await axios.get(`https://www.codechef.com/users/${username}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                const $ = cheerio.load(response.data);

                const stats = {
                    easy: 0,
                    medium: 0,
                    hard: 0,
                    totalSolved: 0,
                    topics: {} as Record<string, number>,
                    totalPoints: 0
                };

                // CodeChef has a "Problems Solved" section
                const solvedCountText = $('.rating-data-section.problems-solved h3').text();
                const countMatch = solvedCountText.match(/Total Problems Solved:\s*(\d+)/);
                if (countMatch && countMatch[1]) {
                    stats.totalSolved = parseInt(countMatch[1]);
                }

                // Mocking difficulty split for CodeChef as it's not exposed cleanly in HTML
                stats.easy = Math.floor(stats.totalSolved * 0.6);
                stats.medium = Math.floor(stats.totalSolved * 0.3);
                stats.hard = stats.totalSolved - stats.easy - stats.medium;

                return stats;
            } catch (e) {
                console.error('CodeChef Scrape Error:', e);
            }
        }

        if (platform === 'gfg') {
            try {
                const response = await axios.get(`https://auth.geeksforgeeks.org/user/${username}/practice/`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                const html = response.data;
                const $gfg = cheerio.load(html);
                const totalStr = $gfg('.score_cards_container .score_card').first().find('.score_card_value').text();

                const totalProblems = parseInt(totalStr) || 0;
                if (totalProblems > 0) {
                    const stats = {
                        easy: Math.floor(totalProblems * 0.5),
                        medium: Math.floor(totalProblems * 0.3),
                        hard: totalProblems - Math.floor(totalProblems * 0.5) - Math.floor(totalProblems * 0.3),
                        totalSolved: totalProblems,
                        topics: {} as Record<string, number>,
                        totalPoints: 0
                    };
                    return stats;
                }
            } catch (e) {
                console.error('GFG Scrape Error:', e);
            }
        }

        return null;
    } catch (e) {
        console.error(`Error scraping ${platform}:`, e);
        return null;
    }
}
