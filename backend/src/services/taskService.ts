import prisma from '../config/db.js';
import { TOPIC_MAPPING } from './analyticsService';

/**
 * Checks if user is eligible for a Daily Task
 */
export const checkTaskEligibility = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { stats: true }
    });

    if (!user) return { eligible: false, reason: "User not found." };

    // Use combined solved count across ALL platforms, not just LeetCode
    const leetcodeSolved = user.stats?.totalSolved ?? 0;
    const gfgSolved = user.gfgPoints > 0 ? Math.ceil(user.gfgPoints / 2) : 0;
    const ccSolved = user.codechefPoints > 0 ? Math.ceil(user.codechefPoints / 2) : 0;
    const cfSolved = user.codeforcesPoints > 0 ? Math.ceil(user.codeforcesPoints / 2) : 0;
    const totalSolved = leetcodeSolved + gfgSolved + ccSolved + cfSolved;

    if (totalSolved < 20) {
        return { eligible: false, reason: `Solve at least 20 questions across platforms to unlock. (You have ~${totalSolved})` };
    }

    if (!user.topicStats) {
        return { eligible: false, reason: "Not enough topic data. Sync your profile first." };
    }

    // Normalize raw topic keys and count how many canonical topics the user has solved
    const rawKeys = Object.keys(user.topicStats as Record<string, number>);
    const normalizedTopics = new Set(
        rawKeys.map(k => TOPIC_MAPPING[k.toLowerCase()] ?? k)
    );

    const requiredTopics = Math.max(2, 2); // at least 2 topics practiced

    if (normalizedTopics.size < requiredTopics) {
        return { eligible: false, reason: `Attempt at least ${requiredTopics} different DSA topics to unlock. (You have ${normalizedTopics.size})` };
    }

    return { eligible: true };
};

/**
 * Generates a Daily Task for a user.
 * PRIMARY: picks a problem from the user's ACTUAL LeetCode solved history (Submission table).
 * FALLBACK: uses static QUESTION_BANK if user has no LeetCode submissions stored yet.
 * 
 * Groups solved problems by topic → picks the weakest topic (fewest solved) →
 * picks a random Medium/Hard problem from that topic → avoids last-7-days repeats.
 */
export const generateDailyTask = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { stats: true } });
    if (!user) return null;

    // 1. Fetch ALL LeetCode submissions for this user from the Submission table
    const leetcodeSubmissions = await (prisma as any).submission.findMany({
        where: {
            userId,
            platform: { contains: 'leetcode', mode: 'insensitive' }
        },
        orderBy: { dateSolved: 'desc' }
    });

    // 2. Fallback to static bank if user has no LeetCode submission history
    if (!leetcodeSubmissions || leetcodeSubmissions.length === 0) {
        return generateFromStaticBank(userId, user);
    }

    // 3. Build topic → unique problems map from actual history
    const topicMap: Record<string, { title: string; titleSlug: string; difficulty: string; estimatedMinutes: number }[]> = {};
    for (const sub of leetcodeSubmissions) {
        const topic = sub.topic || 'General';
        const slug = sub.problemName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
        const minutes = sub.difficulty === 'Easy' ? 15 : sub.difficulty === 'Hard' ? 60 : 30;
        if (!topicMap[topic]) topicMap[topic] = [];
        if (!topicMap[topic].find((q: any) => q.title === sub.problemName)) {
            topicMap[topic].push({
                title: sub.problemName,
                titleSlug: slug,
                difficulty: sub.difficulty || 'Medium',
                estimatedMinutes: minutes
            });
        }
    }

    // 4. Fetch last 7 days of tasks to avoid repeating the same problem
    const pastTasks = await (prisma as any).dailyTask.findMany({
        where: {
            userId,
            taskDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        orderBy: { taskDate: 'desc' }
    });
    const recentTitles: string[] = pastTasks.map((t: any) => t.questionTitle);
    const recentTopics: string[] = pastTasks.map((t: any) => t.topic);

    // 5. Sort topics: fewest problems first (weakest area)
    const eligibleTopics = Object.entries(topicMap)
        .sort((a, b) => a[1].length - b[1].length)
        .map(([topic]) => topic);

    if (eligibleTopics.length === 0) return generateFromStaticBank(userId, user);

    // 6. Rotate to avoid the same topic every day
    const allPastCount = await (prisma as any).dailyTask.count({ where: { userId } });
    const rotationIndex = allPastCount % eligibleTopics.length;
    const rotatedList = [
        ...eligibleTopics.slice(rotationIndex),
        ...eligibleTopics.slice(0, rotationIndex)
    ];
    const selectedTopic = rotatedList.find(t => !recentTopics.slice(0, 3).includes(t)) || rotatedList[0];

    // 7. Pick a problem from that topic the user hasn't been assigned recently
    const pool = topicMap[selectedTopic] || [];
    const available = pool.filter((q: any) => !recentTitles.includes(q.title));
    const finalPool = available.length > 0 ? available : pool;
    const medHard = finalPool.filter((q: any) => q.difficulty === 'Medium' || q.difficulty === 'Hard');
    const candidates = medHard.length > 0 ? medHard : finalPool;
    const question = candidates[Math.floor(Math.random() * candidates.length)];

    if (!question) return generateFromStaticBank(userId, user);

    // 8. Save and return
    const newTask = await (prisma as any).dailyTask.create({
        data: {
            userId,
            questionTitle: question.title,
            questionUrl: `https://leetcode.com/problems/${question.titleSlug}/`,
            topic: selectedTopic,
            difficulty: question.difficulty
        }
    });

    return { ...newTask, estimatedMinutes: question.estimatedMinutes };
};

/**
 * Fallback: picks from static QUESTION_BANK when user has no LeetCode submissions.
 */
const generateFromStaticBank = async (userId: string, user: any) => {
    if (!user.topicStats) return null;
    const topicCounts = user.topicStats as Record<string, number>;

    const userSolvedTopics: Record<string, number> = {};
    for (const [rawTopic, count] of Object.entries(topicCounts)) {
        if (count > 0) {
            const canonical = TOPIC_MAPPING[rawTopic.toLowerCase()] ?? rawTopic;
            userSolvedTopics[canonical] = (userSolvedTopics[canonical] || 0) + count;
        }
    }

    const eligibleTopics = Object.entries(userSolvedTopics)
        .filter(([topic]) => !!QUESTION_BANK[topic])
        .sort((a, b) => a[1] - b[1])
        .map(([topic]) => topic);

    if (eligibleTopics.length === 0) return null;

    const pastTasks = await (prisma as any).dailyTask.findMany({
        where: { userId, taskDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        orderBy: { taskDate: 'desc' }
    });
    const recentTopics: string[] = pastTasks.map((t: any) => t.topic);
    const recentTitles: string[] = pastTasks.map((t: any) => t.questionTitle);

    const allPastCount = await (prisma as any).dailyTask.count({ where: { userId } });
    const rotatedList = [
        ...eligibleTopics.slice(allPastCount % eligibleTopics.length),
        ...eligibleTopics.slice(0, allPastCount % eligibleTopics.length)
    ];
    let selectedTopic = rotatedList.find(t => !recentTopics.slice(0, 3).includes(t)) || rotatedList[0];

    let question: { title: string; titleSlug: string; difficulty: string; estimatedMinutes: number } | null = null;
    for (const topic of [selectedTopic, ...eligibleTopics.filter(t => t !== selectedTopic)]) {
        question = pickQuestionFromBank(topic, recentTitles);
        if (question) { selectedTopic = topic; break; }
    }
    if (!question) return null;

    const newTask = await (prisma as any).dailyTask.create({
        data: {
            userId,
            questionTitle: question.title,
            questionUrl: `https://leetcode.com/problems/${question.titleSlug}/`,
            topic: selectedTopic,
            difficulty: question.difficulty
        }
    });
    return { ...newTask, estimatedMinutes: question.estimatedMinutes };
};

/**
 * Curated static question bank per DSA topic (free LeetCode problems)
 * Each question now includes estimatedMinutes
 */
export const QUESTION_BANK: Record<string, { title: string; titleSlug: string; difficulty: string; estimatedMinutes: number }[]> = {
    'Arrays & Hashing': [
        { title: 'Two Sum', titleSlug: 'two-sum', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'Contains Duplicate', titleSlug: 'contains-duplicate', difficulty: 'Easy', estimatedMinutes: 10 },
        { title: 'Group Anagrams', titleSlug: 'group-anagrams', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Top K Frequent Elements', titleSlug: 'top-k-frequent-elements', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Product of Array Except Self', titleSlug: 'product-of-array-except-self', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Encode and Decode Strings', titleSlug: 'encode-and-decode-strings', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Longest Consecutive Sequence', titleSlug: 'longest-consecutive-sequence', difficulty: 'Medium', estimatedMinutes: 35 },
        { title: 'Valid Anagram', titleSlug: 'valid-anagram', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'Sort Colors', titleSlug: 'sort-colors', difficulty: 'Medium', estimatedMinutes: 20 },
        { title: 'Subarray Sum Equals K', titleSlug: 'subarray-sum-equals-k', difficulty: 'Medium', estimatedMinutes: 30 },
    ],
    'Two Pointers': [
        { title: 'Valid Palindrome', titleSlug: 'valid-palindrome', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: '3Sum', titleSlug: '3sum', difficulty: 'Medium', estimatedMinutes: 35 },
        { title: 'Container With Most Water', titleSlug: 'container-with-most-water', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Trapping Rain Water', titleSlug: 'trapping-rain-water', difficulty: 'Hard', estimatedMinutes: 60 },
        { title: 'Two Sum II Input Array Is Sorted', titleSlug: 'two-sum-ii-input-array-is-sorted', difficulty: 'Medium', estimatedMinutes: 20 },
        { title: 'Remove Duplicates from Sorted Array', titleSlug: 'remove-duplicates-from-sorted-array', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'Move Zeroes', titleSlug: 'move-zeroes', difficulty: 'Easy', estimatedMinutes: 10 },
    ],
    'Sliding Window': [
        { title: 'Best Time to Buy and Sell Stock', titleSlug: 'best-time-to-buy-and-sell-stock', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'Longest Substring Without Repeating Characters', titleSlug: 'longest-substring-without-repeating-characters', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Longest Repeating Character Replacement', titleSlug: 'longest-repeating-character-replacement', difficulty: 'Medium', estimatedMinutes: 35 },
        { title: 'Minimum Window Substring', titleSlug: 'minimum-window-substring', difficulty: 'Hard', estimatedMinutes: 60 },
        { title: 'Sliding Window Maximum', titleSlug: 'sliding-window-maximum', difficulty: 'Hard', estimatedMinutes: 60 },
        { title: 'Find All Anagrams in a String', titleSlug: 'find-all-anagrams-in-a-string', difficulty: 'Medium', estimatedMinutes: 25 },
    ],
    'Stack': [
        { title: 'Valid Parentheses', titleSlug: 'valid-parentheses', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'Min Stack', titleSlug: 'min-stack', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Evaluate Reverse Polish Notation', titleSlug: 'evaluate-reverse-polish-notation', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Generate Parentheses', titleSlug: 'generate-parentheses', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Daily Temperatures', titleSlug: 'daily-temperatures', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Car Fleet', titleSlug: 'car-fleet', difficulty: 'Medium', estimatedMinutes: 35 },
        { title: 'Largest Rectangle in Histogram', titleSlug: 'largest-rectangle-in-histogram', difficulty: 'Hard', estimatedMinutes: 60 },
    ],
    'Binary Search': [
        { title: 'Binary Search', titleSlug: 'binary-search', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'Search a 2D Matrix', titleSlug: 'search-a-2d-matrix', difficulty: 'Medium', estimatedMinutes: 20 },
        { title: 'Koko Eating Bananas', titleSlug: 'koko-eating-bananas', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Find Minimum in Rotated Sorted Array', titleSlug: 'find-minimum-in-rotated-sorted-array', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Search in Rotated Sorted Array', titleSlug: 'search-in-rotated-sorted-array', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Time Based Key-Value Store', titleSlug: 'time-based-key-value-store', difficulty: 'Medium', estimatedMinutes: 35 },
        { title: 'Median of Two Sorted Arrays', titleSlug: 'median-of-two-sorted-arrays', difficulty: 'Hard', estimatedMinutes: 60 },
    ],
    'Linked List': [
        { title: 'Reverse Linked List', titleSlug: 'reverse-linked-list', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'Merge Two Sorted Lists', titleSlug: 'merge-two-sorted-lists', difficulty: 'Easy', estimatedMinutes: 20 },
        { title: 'Reorder List', titleSlug: 'reorder-list', difficulty: 'Medium', estimatedMinutes: 35 },
        { title: 'Remove Nth Node From End of List', titleSlug: 'remove-nth-node-from-end-of-list', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Linked List Cycle', titleSlug: 'linked-list-cycle', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'LRU Cache', titleSlug: 'lru-cache', difficulty: 'Medium', estimatedMinutes: 45 },
        { title: 'Merge k Sorted Lists', titleSlug: 'merge-k-sorted-lists', difficulty: 'Hard', estimatedMinutes: 60 },
    ],
    'Trees': [
        { title: 'Invert Binary Tree', titleSlug: 'invert-binary-tree', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'Maximum Depth of Binary Tree', titleSlug: 'maximum-depth-of-binary-tree', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'Diameter of Binary Tree', titleSlug: 'diameter-of-binary-tree', difficulty: 'Easy', estimatedMinutes: 20 },
        { title: 'Balanced Binary Tree', titleSlug: 'balanced-binary-tree', difficulty: 'Easy', estimatedMinutes: 20 },
        { title: 'Level Order Traversal', titleSlug: 'binary-tree-level-order-traversal', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Binary Tree Right Side View', titleSlug: 'binary-tree-right-side-view', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Lowest Common Ancestor of BST', titleSlug: 'lowest-common-ancestor-of-a-binary-search-tree', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Binary Tree Maximum Path Sum', titleSlug: 'binary-tree-maximum-path-sum', difficulty: 'Hard', estimatedMinutes: 60 },
        { title: 'Serialize and Deserialize Binary Tree', titleSlug: 'serialize-and-deserialize-binary-tree', difficulty: 'Hard', estimatedMinutes: 60 },
    ],
    'Graphs': [
        { title: 'Number of Islands', titleSlug: 'number-of-islands', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Clone Graph', titleSlug: 'clone-graph', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Max Area of Island', titleSlug: 'max-area-of-island', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Pacific Atlantic Water Flow', titleSlug: 'pacific-atlantic-water-flow', difficulty: 'Medium', estimatedMinutes: 40 },
        { title: 'Course Schedule', titleSlug: 'course-schedule', difficulty: 'Medium', estimatedMinutes: 35 },
        { title: 'Word Ladder', titleSlug: 'word-ladder', difficulty: 'Hard', estimatedMinutes: 60 },
        { title: 'Rotting Oranges', titleSlug: 'rotting-oranges', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Walls and Gates', titleSlug: 'walls-and-gates', difficulty: 'Medium', estimatedMinutes: 30 },
    ],
    'Heap / Priority Queue': [
        { title: 'Kth Largest Element in a Stream', titleSlug: 'kth-largest-element-in-a-stream', difficulty: 'Easy', estimatedMinutes: 20 },
        { title: 'Last Stone Weight', titleSlug: 'last-stone-weight', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'K Closest Points to Origin', titleSlug: 'k-closest-points-to-origin', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Kth Largest Element in an Array', titleSlug: 'kth-largest-element-in-an-array', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Task Scheduler', titleSlug: 'task-scheduler', difficulty: 'Medium', estimatedMinutes: 35 },
        { title: 'Find Median from Data Stream', titleSlug: 'find-median-from-data-stream', difficulty: 'Hard', estimatedMinutes: 60 },
    ],
    'Backtracking': [
        { title: 'Subsets', titleSlug: 'subsets', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Combination Sum', titleSlug: 'combination-sum', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Permutations', titleSlug: 'permutations', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Subsets II', titleSlug: 'subsets-ii', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Combination Sum II', titleSlug: 'combination-sum-ii', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Word Search', titleSlug: 'word-search', difficulty: 'Medium', estimatedMinutes: 40 },
        { title: 'Palindrome Partitioning', titleSlug: 'palindrome-partitioning', difficulty: 'Medium', estimatedMinutes: 35 },
        { title: 'N-Queens', titleSlug: 'n-queens', difficulty: 'Hard', estimatedMinutes: 60 },
    ],
    'Dynamic Programming': [
        { title: 'Climbing Stairs', titleSlug: 'climbing-stairs', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'Min Cost Climbing Stairs', titleSlug: 'min-cost-climbing-stairs', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'House Robber', titleSlug: 'house-robber', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'House Robber II', titleSlug: 'house-robber-ii', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Longest Palindromic Substring', titleSlug: 'longest-palindromic-substring', difficulty: 'Medium', estimatedMinutes: 35 },
        { title: 'Coin Change', titleSlug: 'coin-change', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Word Break', titleSlug: 'word-break', difficulty: 'Medium', estimatedMinutes: 35 },
        { title: 'Longest Increasing Subsequence', titleSlug: 'longest-increasing-subsequence', difficulty: 'Medium', estimatedMinutes: 35 },
        { title: 'Unique Paths', titleSlug: 'unique-paths', difficulty: 'Medium', estimatedMinutes: 20 },
        { title: 'Jump Game', titleSlug: 'jump-game', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Edit Distance', titleSlug: 'edit-distance', difficulty: 'Hard', estimatedMinutes: 60 },
    ],
    'Greedy': [
        { title: 'Maximum Subarray', titleSlug: 'maximum-subarray', difficulty: 'Medium', estimatedMinutes: 20 },
        { title: 'Jump Game II', titleSlug: 'jump-game-ii', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Gas Station', titleSlug: 'gas-station', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Hand of Straights', titleSlug: 'hand-of-straights', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Partition Labels', titleSlug: 'partition-labels', difficulty: 'Medium', estimatedMinutes: 25 },
        { title: 'Merge Intervals', titleSlug: 'merge-intervals', difficulty: 'Medium', estimatedMinutes: 25 },
    ],
    'Bit Manipulation': [
        { title: 'Single Number', titleSlug: 'single-number', difficulty: 'Easy', estimatedMinutes: 10 },
        { title: 'Number of 1 Bits', titleSlug: 'number-of-1-bits', difficulty: 'Easy', estimatedMinutes: 10 },
        { title: 'Counting Bits', titleSlug: 'counting-bits', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'Reverse Bits', titleSlug: 'reverse-bits', difficulty: 'Easy', estimatedMinutes: 15 },
        { title: 'Missing Number', titleSlug: 'missing-number', difficulty: 'Easy', estimatedMinutes: 10 },
        { title: 'Sum of Two Integers', titleSlug: 'sum-of-two-integers', difficulty: 'Medium', estimatedMinutes: 30 },
        { title: 'Reverse Integer', titleSlug: 'reverse-integer', difficulty: 'Medium', estimatedMinutes: 25 },
    ],
};

/**
 * Pick a question from static bank for a given topic
 */
export const pickQuestionFromBank = (topic: string, pastTaskTitles: string[]) => {
    const pool = QUESTION_BANK[topic] || null;
    if (!pool || pool.length === 0) return null;

    // Filter out recently used questions
    const available = pool.filter(q => !pastTaskTitles.includes(q.title));
    if (available.length === 0) return pool[Math.floor(Math.random() * pool.length)]; // reset if all used

    // Prefer Medium/Hard for revision challenge
    const medHard = available.filter(q => q.difficulty === 'Medium' || q.difficulty === 'Hard');
    const finalPool = medHard.length > 0 ? medHard : available;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
};

/**
 * Auto-completes the daily task if the user's recent LeetCode submissions
 * contain the task's question title (case-insensitive match).
 */
export const checkAutoCompletion = async (userId: string) => {
    // 1. Find today's active uncompleted task
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeTask = await prisma.dailyTask.findFirst({
        where: { userId, taskDate: { gte: today }, completed: false }
    });

    if (!activeTask) return { alreadyCompleted: true, completed: false };

    // 2. Fetch user's recent LeetCode submissions from their stored stats
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { stats: true }
    });

    const recentSubmissions: any[] = (user?.stats?.recentSubmission as any[]) || [];

    // 3. Check if any recent submission title matches the task question (fuzzy match)
    const taskTitle = activeTask.questionTitle.toLowerCase().trim();
    const matched = recentSubmissions.some((sub: any) => {
        const subTitle = (sub.title || '').toLowerCase().trim();
        const isMatch = subTitle === taskTitle || subTitle.includes(taskTitle) || taskTitle.includes(subTitle);
        
        if (isMatch && sub.timestamp) {
            // Task should only auto-complete if the submission happened today (or after task was assigned)
            const subTime = parseInt(sub.timestamp) * 1000;
            return subTime >= today.getTime();
        }
        
        return isMatch;
    });

    if (!matched) return { alreadyCompleted: false, completed: false };

    // 4. Auto-complete the task and award points
    await prisma.dailyTask.update({
        where: { id: activeTask.id },
        data: { completed: true }
    });

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { totalPoints: { increment: 10 } }
    });

    return { alreadyCompleted: false, completed: true, newTotalPoints: updatedUser.totalPoints, taskId: activeTask.id };
};

export const completeDailyTask = async (taskId: string, userId: string) => {
    const task = await prisma.dailyTask.findFirst({
        where: { id: taskId, userId, completed: false }
    });

    if (!task) throw new Error("Task not found or already completed");

    // 1. Mark task complete
    await prisma.dailyTask.update({
        where: { id: taskId },
        data: { completed: true }
    });

    // 2. Award 10 Bonus Points
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            totalPoints: { increment: 10 }
        }
    });

    return { success: true, newTotalPoints: user.totalPoints };
};
