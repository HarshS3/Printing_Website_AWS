const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const sns = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function publishEvent(eventType, data) {
  // Skip if no topic ARN configured (local development)
  if (!process.env.ORDER_EVENTS_TOPIC_ARN) {
    console.log(`[LOCAL] Event skipped: ${eventType}`, data);
    return;
  }

  await sns.send(new PublishCommand({
    TopicArn: process.env.ORDER_EVENTS_TOPIC_ARN,
    Message: JSON.stringify({ eventType, data }),
    Subject: eventType,
    MessageAttributes: {
      eventType: {
        DataType: 'String',
        StringValue: eventType,
      },
    },
  }));

  console.log(`Event published: ${eventType}`, data);
}

module.exports = { publishEvent };
