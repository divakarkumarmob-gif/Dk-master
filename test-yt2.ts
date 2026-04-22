import ytSearch from 'yt-search';

async function test() {
    const r1 = await ytSearch({ query: 'Electric Charges and Fields full lecture NEET Physics', category: 'education' });
    console.log("R1 Author:", r1.videos[0]?.author?.name);
    
    const r2 = await ytSearch({ query: 'Haloalkanes and Haloarenes full lecture NEET Chemistry', category: 'education' });
    console.log("R2 Author:", r2.videos[0]?.author?.name);
}
test();
