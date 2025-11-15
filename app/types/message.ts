export interface Message {
    id: string;
    collaborationId: string;
    senderId: string;
    senderName: string;
    senderProfileImage?: string;
    message: string;
    createdAt: Date;
}
