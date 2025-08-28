import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactMessagesTable } from '../db/schema';
import { type ContactInput } from '../schema';
import { submitContact } from '../handlers/submit_contact';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: ContactInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  message: 'This is a test contact message with more than 10 characters.'
};

describe('submitContact', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should save contact message to database', async () => {
    const result = await submitContact(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.message).toEqual(testInput.message);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.is_read).toEqual(false); // Default value
  });

  it('should persist contact message in database', async () => {
    const result = await submitContact(testInput);

    // Query database to verify record was saved
    const messages = await db.select()
      .from(contactMessagesTable)
      .where(eq(contactMessagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].name).toEqual('John Doe');
    expect(messages[0].email).toEqual('john.doe@example.com');
    expect(messages[0].message).toEqual(testInput.message);
    expect(messages[0].created_at).toBeInstanceOf(Date);
    expect(messages[0].is_read).toEqual(false);
  });

  it('should handle different contact form data', async () => {
    const differentInput: ContactInput = {
      name: 'Jane Smith',
      email: 'jane.smith@company.org',
      message: 'I am interested in learning more about your upcoming product launch.'
    };

    const result = await submitContact(differentInput);

    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@company.org');
    expect(result.message).toEqual(differentInput.message);
    expect(result.is_read).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should allow multiple contact messages from same email', async () => {
    const firstMessage: ContactInput = {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      message: 'First message with sufficient length for validation.'
    };

    const secondMessage: ContactInput = {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      message: 'Second message from the same email address with different content.'
    };

    // Submit two messages with same email
    const result1 = await submitContact(firstMessage);
    const result2 = await submitContact(secondMessage);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.message).toEqual(firstMessage.message);
    expect(result2.message).toEqual(secondMessage.message);

    // Verify both messages exist in database
    const allMessages = await db.select()
      .from(contactMessagesTable)
      .where(eq(contactMessagesTable.email, 'alice@example.com'))
      .execute();

    expect(allMessages).toHaveLength(2);
  });

  it('should set created_at to current time', async () => {
    const beforeSubmission = new Date();
    const result = await submitContact(testInput);
    const afterSubmission = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeSubmission.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterSubmission.getTime());
  });

  it('should handle long messages correctly', async () => {
    const longMessageInput: ContactInput = {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a very long message '.repeat(20) + 'that should still be handled properly by the system.'
    };

    const result = await submitContact(longMessageInput);

    expect(result.message).toEqual(longMessageInput.message);
    expect(result.message.length).toBeGreaterThan(100);

    // Verify it was saved correctly
    const savedMessage = await db.select()
      .from(contactMessagesTable)
      .where(eq(contactMessagesTable.id, result.id))
      .execute();

    expect(savedMessage[0].message).toEqual(longMessageInput.message);
  });
});