'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Message } from '@/app/types/message';
import { db } from '@/lib/firebase';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';

interface CommunicationThreadProps {
    collaborationId: string;
    otherPartyName: string;
    isCompleted?: boolean;
}

export default function CommunicationThread({ collaborationId, otherPartyName, isCompleted = false }: CommunicationThreadProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Listen to messages in real-time
    useEffect(() => {
        if (!collaborationId) return;

        const messagesRef = collection(db, 'collaborations', collaborationId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesData: Message[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                messagesData.push({
                    id: doc.id,
                    collaborationId: data.collaborationId,
                    senderId: data.senderId,
                    senderName: data.senderName,
                    senderProfileImage: data.senderProfileImage,
                    message: data.message,
                    createdAt: data.createdAt?.toDate() || new Date(),
                });
            });
            setMessages(messagesData);
        }, (error) => {
            console.error('Error fetching messages:', error);
        });

        return () => unsubscribe();
    }, [collaborationId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !newMessage.trim()) return;

        setSending(true);
        try {
            const messagesRef = collection(db, 'collaborations', collaborationId, 'messages');

            await addDoc(messagesRef, {
                collaborationId,
                senderId: user.uid,
                senderName: user.displayName || 'Unknown User',
                senderProfileImage: user.photoURL || undefined,
                message: newMessage.trim(),
                createdAt: serverTimestamp(),
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const messageDate = new Date(date);
        const diffInMs = now.getTime() - messageDate.getTime();
        const diffInMinutes = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMs / 3600000);
        const diffInDays = Math.floor(diffInMs / 86400000);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return messageDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="p-4 border-b">
                <h2 className="text-xl font-bold text-gray-900">Project Communication</h2>
                <p className="text-sm text-gray-600 mt-1">
                    Chat with {otherPartyName} about this collaboration
                </p>
                <div className="mt-2 flex items-start">
                    <svg className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-gray-600">
                        All communication is saved on the platform for dispute resolution purposes.
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-gray-500 font-medium">No messages yet</p>
                        <p className="text-sm text-gray-400 mt-1">Start the conversation about your collaboration</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => {
                            const isCurrentUser = message.senderId === user?.uid;
                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[70%]`}>
                                        {/* Avatar */}
                                        <div className={`flex-shrink-0 ${isCurrentUser ? 'ml-2' : 'mr-2'}`}>
                                            {message.senderProfileImage ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={message.senderProfileImage}
                                                    alt={message.senderName}
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <span className="text-gray-600 text-sm font-medium">
                                                        {message.senderName.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Message Content */}
                                        <div>
                                            <div
                                                className={`rounded-lg px-4 py-2 ${isCurrentUser
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white text-gray-900 border border-gray-200'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap break-words">
                                                    {message.message}
                                                </p>
                                            </div>
                                            <p
                                                className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'
                                                    }`}
                                            >
                                                {formatTimestamp(message.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
                {isCompleted ? (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                        <p className="text-sm text-gray-600">
                            This project is complete. The communication thread is now read-only.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            rows={2}
                            disabled={sending}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
                        >
                            {sending ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Send
                                </>
                            )}
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                            Press Enter to send, Shift+Enter for new line
                        </p>
                    </form>
                )}
            </div>
        </div >
    );
}
