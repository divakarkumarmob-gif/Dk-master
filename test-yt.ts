import ytSearch from 'yt-search';

async function test() {
    try {
        const query1 = "Electric Charges and Fields full lecture revision NEET Physics NEET full lecture";
        const r1 = await ytSearch({ query: query1, category: 'education' });
        console.log("R1 ID:", r1.videos[0]?.videoId);
        console.log("R1 Title:", r1.videos[0]?.title);

        const query2 = "Haloalkanes and Haloarenes full lecture revision NEET Chemistry NEET full lecture";
        const r2 = await ytSearch({ query: query2, category: 'education' });
        console.log("R2 ID:", r2.videos[0]?.videoId);
        console.log("R2 Title:", r2.videos[0]?.title);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
