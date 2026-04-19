export const INITIAL_MESSAGE_KEY = 'chat-initial-message';

export const DELEGATION_FEEDBACK_TEXT =
    'הסוכן לא הצליח לסכם את הממצאים בטקסט. נסה להפנות את השאלה לסוכן אחר או לנסח את הבקשה מחדש.';

export interface InitialMessageData {
    chatId: string;
    text: string;
}
