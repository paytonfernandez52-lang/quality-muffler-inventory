const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  try {
    const { name, category, part_number, quantity, urgent_threshold = 1 } = JSON.parse(event.body || '{}');

    const isUrgent = quantity <= urgent_threshold;
    const subject = isUrgent
      ? `🚨 URGENT: ${name} — Only ${quantity} left in stock`
      : `⚠️ Low Stock: ${name} — ${quantity} remaining`;

    const alertMessage = isUrgent
      ? 'Reorder immediately to avoid a stockout.'
      : 'Stock is getting low. Consider reordering soon to avoid running out.';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Quality Muffler Inventory <hello@paytonwebsolutions.com>',
        to: 'qualitymufflervisalia@gmail.com',
        subject,
        html: `
          <div style="font-family:sans-serif;max-width:480px;padding:24px;">
            <h2 style="margin-bottom:4px;">${isUrgent ? '🚨 Urgent Stock Alert' : '⚠️ Low Stock Alert'}</h2>
            <p style="color:#555;margin-bottom:20px;">Quality Muffler — Inventory System</p>
            <div style="background:#f4f4f5;border-radius:12px;padding:16px 20px;">
              <p style="margin:6px 0;"><strong>Item:</strong> ${name}</p>
              <p style="margin:6px 0;"><strong>Category:</strong> ${category}</p>
              <p style="margin:6px 0;"><strong>Part Number:</strong> ${part_number || 'N/A'}</p>
              <p style="margin:6px 0;"><strong>Quantity Remaining:</strong> <span style="color:${isUrgent ? '#dc2626' : '#d97706'};font-weight:700;">${quantity}</span></p>
            </div>
            <p style="color:#666;font-size:14px;margin-top:20px;">${alertMessage}</p>
          </div>`
      })
    });

    return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) };
  }
};
