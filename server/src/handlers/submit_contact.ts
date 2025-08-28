import { db } from '../db';
import { contactMessagesTable } from '../db/schema';
import { type ContactInput, type ContactMessage } from '../schema';

export const submitContact = async (input: ContactInput): Promise<ContactMessage> => {
  try {
    // Insert contact message record
    const result = await db.insert(contactMessagesTable)
      .values({
        name: input.name,
        email: input.email,
        message: input.message
        // created_at and is_read will use default values from schema
      })
      .returning()
      .execute();

    // Return the created contact message
    const contactMessage = result[0];
    return {
      ...contactMessage
    };
  } catch (error) {
    console.error('Contact form submission failed:', error);
    throw error;
  }
};