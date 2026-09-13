export default async ({ req, res, log, error }) => {
  log('Starting SMOC Times 24/7 autonomous discovery crawler on Appwrite Cloud...');

  const siteUrl = process.env.SITE_URL || 'https://hollywood-chronicle.vercel.app';

  try {
    const subreddits = [
      'BollyBlindsNGossip',
      'bollywood',
      'tollywood',
      'kollywood',
      'IndianCinema',
      'IndianOTTbestof',
      'popculturechat',
      'movies',
      'boxoffice'
    ];

    log(`Appwrite trigger: Probing ${subreddits.length} Indian & Global subreddits + RSS wire feeds.`);

    // Trigger the autonomous editorial matrix on SMOC Times platform
    const endpoint = `${siteUrl}/api/cron/autonomous-worker?force=true`;
    log(`Dispatching crawler trigger to ${endpoint}...`);

    const cycleResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SMOC-Times-Appwrite-Crawler/2.0'
      }
    });

    if (!cycleResponse.ok) {
      const errText = await cycleResponse.text();
      error(`Autonomous cycle HTTP error ${cycleResponse.status}: ${errText}`);
      return res.json({
        success: false,
        error: `Cycle responded with status ${cycleResponse.status}`,
        details: errText
      }, 500);
    }

    const result = await cycleResponse.json();
    log(`Autonomous sweep completed successfully: ${JSON.stringify(result.discovery_summary || {})}`);

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      service: 'THE SMOC TIMES Autonomous Intelligence Core',
      region: 'sgp.cloud.appwrite.io',
      summary: result.discovery_summary || null,
      published_count: result.new_articles_published?.length || 0
    });
  } catch (err) {
    error(`Autonomous crawler execution exception: ${err.message}`);
    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};
