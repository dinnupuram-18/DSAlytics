/**
 * Analytics Service
 * Handles comparison between user performance and industry interview standards.
 */

export interface TopicStandard {
    topic: string;
    requiredCount: number;
    importance: 'High' | 'Medium' | 'Low';
}

export const INTERVIEW_DS_STANDARDS: TopicStandard[] = [
    { topic: 'Arrays & Hashing', requiredCount: 30, importance: 'High' },
    { topic: 'Two Pointers', requiredCount: 15, importance: 'High' },
    { topic: 'Sliding Window', requiredCount: 10, importance: 'High' },
    { topic: 'Stack', requiredCount: 10, importance: 'Medium' },
    { topic: 'Binary Search', requiredCount: 15, importance: 'High' },
    { topic: 'Linked List', requiredCount: 15, importance: 'Medium' },
    { topic: 'Trees', requiredCount: 25, importance: 'High' },
    { topic: 'Graphs', requiredCount: 20, importance: 'High' },
    { topic: 'Heap / Priority Queue', requiredCount: 10, importance: 'Medium' },
    { topic: 'Backtracking', requiredCount: 12, importance: 'High' },
    { topic: 'Dynamic Programming', requiredCount: 25, importance: 'High' },
    { topic: 'Greedy', requiredCount: 15, importance: 'Medium' },
    { topic: 'Bit Manipulation', requiredCount: 8, importance: 'Low' }
];

export const TOPIC_MAPPING: Record<string, string> = {
    'arrays': 'Arrays & Hashing',
    'array': 'Arrays & Hashing',
    'hashing': 'Arrays & Hashing',
    'hash table': 'Arrays & Hashing',
    'strings': 'Arrays & Hashing',
    'string': 'Arrays & Hashing',
    'sorting': 'Arrays & Hashing',
    'sortings': 'Arrays & Hashing',

    'two pointers': 'Two Pointers',

    'sliding window': 'Sliding Window',

    'stack': 'Stack',

    'binary search': 'Binary Search',
    'searching': 'Binary Search',

    'linked list': 'Linked List',
    'linked lists': 'Linked List',

    'trees': 'Trees',
    'tree': 'Trees',
    'binary tree': 'Trees',
    'binary search tree': 'Trees',

    'graphs': 'Graphs',
    'graph': 'Graphs',
    'dfs': 'Graphs',
    'bfs': 'Graphs',
    'depth-first search': 'Graphs',
    'breadth-first search': 'Graphs',
    'dfs and similar': 'Graphs',

    'heap': 'Heap / Priority Queue',
    'priority queue': 'Heap / Priority Queue',
    'heap (priority queue)': 'Heap / Priority Queue',

    'backtracking': 'Backtracking',

    'dynamic programming': 'Dynamic Programming',
    'dp': 'Dynamic Programming',
    'memoization': 'Dynamic Programming',

    'greedy': 'Greedy',

    'bit manipulation': 'Bit Manipulation',
    'bitmasks': 'Bit Manipulation'
};

export const analyzeUserReadiness = (userTopicStats: Record<string, number>) => {
    // Stats are already normalized in scraperService, but we'll do a fallback sum just in case
    const normalizedStats: Record<string, number> = {};
    Object.entries(userTopicStats).forEach(([topic, count]) => {
        const standardTopic = TOPIC_MAPPING[topic.toLowerCase()] || topic;
        normalizedStats[standardTopic] = (normalizedStats[standardTopic] || 0) + count;
    });

    const report = INTERVIEW_DS_STANDARDS.map(standard => {
        const userCount = normalizedStats[standard.topic] || 0;
        const progress = Math.min((userCount / standard.requiredCount) * 100, 100);

        return {
            ...standard,
            userCount,
            progress,
            isReady: progress >= 100,
            gap: Math.max(0, standard.requiredCount - userCount)
        };
    });

    const averageMastery = report.reduce((acc, curr) => acc + curr.progress, 0) / report.length;

    const weakTopics = report
        .filter(r => r.progress < 50 && r.importance === 'High')
        .map(r => r.topic);

    return {
        masteryScore: Math.round(averageMastery),
        topicBreakdown: report,
        criticalWeaknesses: weakTopics,
        recommendation: weakTopics.length > 0
            ? `Focus on ${weakTopics.join(', ')} to improve your interview chances.`
            : "You have a solid foundation! Keep practicing complex Dynamic Programming problems."
    };
};
