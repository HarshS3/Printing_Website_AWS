// Triggered by SQS
// Processes order — generates invoice, notifies print team
exports.handler = async (event) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);

    // SQS receives SNS message wrapped in body
    const snsMessage = JSON.parse(body.Message);
    const { eventType, data } = snsMessage;

    if (eventType === 'ORDER_PLACED') {
      console.log(`Processing order #${data.orderId}`);
      console.log(`Customer: ${data.customerName}`);
      console.log(`Product ID: ${data.productId}, Quantity: ${data.quantity}`);

      // Step 1 — Generate invoice
      console.log(`Generating invoice for order #${data.orderId}...`);
      // In production — generate PDF using pdfkit or similar

      // Step 2 — Notify print team
      console.log(`Notifying print team for order #${data.orderId}...`);
      // In production — send Slack message, email to print team etc.

      // Step 3 — Update order status in DB
      console.log(`Updating order #${data.orderId} status to 'processing'`);
      // In production — update DB status

      console.log(`Order #${data.orderId} processed successfully`);
    }
  }
};
