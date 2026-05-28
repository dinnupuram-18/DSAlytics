import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
    const username = 'tourist'; // CF, CC, etc.
    const hrUsername = 'anita_b'; 
    const gfgUsername = 'a_gfg_user'; // Replace with valid

    console.log("Testing Codeforces...");
    try {
        const response = await axios.get(`https://codeforces.com/api/user.status?handle=tourist`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 8000
        });
        console.log("CF Status:", response.data.status);
    } catch(e: any) {
        console.error("CF Error:", e.message);
    }

    console.log("Testing CodeChef...");
    try {
        const response = await axios.get(`https://www.codechef.com/users/tourist`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 8000
        });
        const $ = cheerio.load(response.data);
        const solvedCountText = $('.rating-data-section.problems-solved h3').text();
        console.log("CC Extracted Text:", solvedCountText);
    } catch(e: any) {
        console.error("CC Error:", e.message);
    }
}

test();
