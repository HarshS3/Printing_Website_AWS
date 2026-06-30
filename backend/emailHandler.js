const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@printcraft.com';

exports.handler = async (event) => {
  for (const record of event.Records) {
    const snsMessage = JSON.parse(record.Sns.Message);
    const { eventType, data } = snsMessage;

    if (eventType === 'ORDER_PLACED') {
      try {
        console.log(`Sending confirmation email to ${data.customerEmail}`);

        await ses.send(new SendEmailCommand({
          Source: SENDER_EMAIL,
          Destination: { ToAddresses: [data.customerEmail] },
          Message: {
            Subject: { Data: `Order Confirmed #${data.orderId}` },
            Body: {
              Html: {
                Data: `
                  <html>
                    <body>
                      <h2>Order Confirmation</h2>
                      <p>Hi ${data.customerName},</p>
                      <p>Thank you for your order! Your order has been confirmed and is being processed.</p>
                      <hr/>
                      <p><strong>Order Details:</strong></p>
                      <ul>
                        <li>Order ID: #${data.orderId}</li>
                        <li>Product ID: ${data.productId}</li>
                        <li>Quantity: ${data.quantity}</li>
                        ${data.notes ? `<li>Special Notes: ${data.notes}</li>` : ''}
                      </ul>
                      <hr/>
                      <p>We'll keep you updated on your order status. If you have any questions, feel free to contact us.</p>
                      <p>Best regards,<br/>PrintShop Team</p>
                    </body>
                  </html>
                `
              },
              Text: {
                Data: `Hi ${data.customerName},\nYour order #${data.orderId} has been confirmed!\nProduct ID: ${data.productId}\nQuantity: ${data.quantity}`
              }
            }
          }
        }));

        console.log(`✅ Email sent successfully to ${data.customerEmail} for order #${data.orderId}`);
      } catch (err) {
        console.error(`❌ Failed to send email to ${data.customerEmail}:`, err.message);
        throw err;
      }
    }
  }
};
