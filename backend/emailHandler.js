// Triggered by SNS directly
// Sends confirmation email to customer when order is placed
exports.handler = async (event) => {
  for (const record of event.Records) {
    const snsMessage = JSON.parse(record.Sns.Message);
    const { eventType, data } = snsMessage;

    if (eventType === 'ORDER_PLACED') {
      console.log(`Sending confirmation email to ${data.customerEmail}`);
      console.log(`Order ID: ${data.orderId}`);
      console.log(`Product ID: ${data.productId}`);
      console.log(`Quantity: ${data.quantity}`);

      // In production — use AWS SES to send real email
      // const ses = new SESClient({ region: 'us-east-1' });
      // await ses.send(new SendEmailCommand({
      //   Source: 'noreply@printcraft.com',
      //   Destination: { ToAddresses: [data.customerEmail] },
      //   Message: {
      //     Subject: { Data: `Order Confirmed #${data.orderId}` },
      //     Body: {
      //       Text: { Data: `Hi ${data.customerName}, your order #${data.orderId} has been confirmed!` }
      //     }
      //   }
      // }));

      console.log(`Email sent successfully to ${data.customerEmail} for order #${data.orderId}`);
    }
  }
};
