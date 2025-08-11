import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class AIService {
  static async routeEmailType(prompt) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a router assistant that classifies email prompts. 
            Analyze the user's prompt and determine if it's a 'sales' email or 'follow-up' email.
            
            Sales emails are for:
            - Selling products/services
            - Business proposals
            - Cold outreach
            - Product pitches
            
            Follow-up emails are for:
            - Checking in on previous conversations
            - Meeting follow-ups
            - General reminders
            - Relationship maintenance
            
            Respond with ONLY one word: either 'sales' or 'follow-up'`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      const classification = response.choices[0].message.content.trim().toLowerCase();
      return classification === 'sales' ? 'sales' : 'follow-up';
    } catch (error) {
      console.error('Router classification error:', error);
      return 'follow-up';
    }
  }

  static async *streamSalesEmail(prompt, to) {
    const businessDomain = to.split('@')[1] || 'your business';
    
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a sales email specialist. Generate concise, professional sales emails.
          
          Requirements:
          - Keep total email under 40 words
          - Max 7-10 words per sentence
          - Be direct and compelling
          - Include a clear call-to-action
          - Personalize for the recipient's business domain
          - Professional but friendly tone
          
          Return JSON format: {"subject": "...", "body": "..."}`
        },
        {
          role: "user",
          content: `Generate a sales email about: ${prompt}
          Recipient domain: ${businessDomain}
          Recipient email: ${to}`
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  }

  static async *streamFollowUpEmail(prompt, to) {
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a follow-up email specialist. Generate polite, professional follow-up emails.
          
          Requirements:
          - Polite and respectful tone
          - Reference the original context
          - Include gentle call-to-action
          - Professional closing
          - Keep it concise but warm
          
          Return JSON format: {"subject": "...", "body": "..."}`
        },
        {
          role: "user",
          content: `Generate a follow-up email about: ${prompt}
          Recipient: ${to}`
        }
      ],
      temperature: 0.6,
      max_tokens: 200,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  }

  static async streamEmail(prompt, to) {
    const emailType = await this.routeEmailType(prompt);
    
    if (emailType === 'sales') {
      return this.streamSalesEmail(prompt, to);
    } else {
      return this.streamFollowUpEmail(prompt, to);
    }
  }

  static async streamEmailByType(prompt, to, assistantType) {

    if (assistantType === 'sales') {
      return this.streamSalesEmail(prompt, to);
    } else {
      return this.streamFollowUpEmail(prompt, to);
    }
  }
}

export default AIService;
