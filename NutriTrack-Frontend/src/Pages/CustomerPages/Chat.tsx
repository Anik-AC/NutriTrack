import { useEffect, useRef, useState } from 'react';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { Sidenav } from '../../Components/Sections';
import axiosInstance from '../../utils/axiosInstance';
import { notify } from '../../utils/notify';
import ReactMarkdown from 'react-markdown';
import { Avatar, AvatarFallback, AvatarImage } from '../../Components/ui/avatar';
import { Input } from '../../Components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '../../Components/ui/table';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatAPIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface MealEntry {
  foodName: string;
  eatenWhen: string;
  details: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
  };
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [mealsSummary, setMealsSummary] = useState<string>('');
  const [mealTable, setMealTable] = useState<JSX.Element | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showYesPrompt, setShowYesPrompt] = useState(false);
  const toast = notify;
  const bottomRef = useRef<HTMLDivElement>(null);
  const userName = JSON.parse(localStorage.getItem('userInfo') || '{}')?.name || 'there';

    const userContext = useContext(UserContext);
    const loggedUser = userContext?.loggedUser || null;


  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const fetchMeals = async () => {
    try {
      const response = await fetch('/api/mealsConsumed', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error fetching meals');
      }

      const data = await response.json();
      const meals: MealEntry[] = data.data;

      const groupedMeals: Record<string, string[]> = {};
      meals.forEach((meal) => {
        const when = meal.eatenWhen.toLowerCase();
        if (!groupedMeals[when]) groupedMeals[when] = [];
        groupedMeals[when].push(meal.foodName);
      });

      // Text summary for GPT
      let summary = '';
      for (const [when, foods] of Object.entries(groupedMeals)) {
        summary += `- ${when}: ${foods.join(', ')}\n`;
      }
      setMealsSummary(summary.trim());

      // Render table for UI
      const table = (
        <Table className="w-fit">
          <TableHeader>
            <TableRow>
              <TableCell className="font-bold">Meal</TableCell>
              <TableCell className="font-bold">Items</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedMeals).map(([meal, items]) => (
              <TableRow key={meal}>
                <TableCell className="capitalize">{meal}</TableCell>
                <TableCell>{items.join(', ')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
      setMealTable(table);

      setMessages([
        {
          role: 'assistant',
          content: `Hi ${userName}! I'm NutriBot 🤖.\n\nHere is what you consumed today:`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setShowYesPrompt(true);
    } catch (err) {
      console.error('Meal fetch error:', err);
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm NutriBot 🤖. I couldn't load your meal history. You can still ask me for diet suggestions!",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  const sendMessage = async (customMessage?: string) => {
    const userInput = customMessage || input.trim();
    if (!userInput) return;

    const timestamp = new Date().toLocaleTimeString();
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userInput, timestamp },
    ];

    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await axiosInstance.post('/api/booking/chat', {
        messages: [
          {
            role: 'system',
            content: `You are NutriBot, a friendly nutrition assistant helping ${userName}. Provide personalized diet suggestions. Here's their intake today:\n\n${mealsSummary || 'No recent meals available.'}`,
          },
          ...newMessages.map(({ role, content }) => ({ role, content } as ChatAPIMessage)),
        ],
      });

      const reply = res.data.reply;
      setMessages([
        ...newMessages,
        {
          role: reply.role,
          content: reply.content,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setShowYesPrompt(false);
    } catch (err) {
      console.error('Error fetching GPT response:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch response from NutriBot.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (mealsSummary) {
      setMessages([
        {
          role: 'assistant',
          content: `Hi again ${userName}! Here's your food summary. Would you like suggestions based on this?`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setShowYesPrompt(true);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm NutriBot 🤖. You can ask me for personalized meal suggestions.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  const getAvatar = (role: 'user' | 'assistant') =>
    role === 'user' ? (
      <Avatar className="size-8">
        <AvatarFallback className="bg-[var(--bright-green)] text-[var(--dark-green)] text-xs font-semibold">
          {getInitials(loggedUser?.name || "User")}
        </AvatarFallback>
      </Avatar>
    ) : (
      <Avatar className="size-8">
        <AvatarImage src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png" alt="NutriBot" />
        <AvatarFallback className="text-xs font-semibold">NB</AvatarFallback>
      </Avatar>
    );


  return (
    <Sidenav>
      <div className="bg-white shadow-md rounded-lg p-0 mb-10">
        <div className="bg-[var(--dark-green)] rounded-t-lg px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            Chat with NutriBot
          </h2>
        </div>
        <div className="p-6 rounded-b-lg text-[var(--dark-green)]">
          <p className="text-base font-medium">
            Ask NutriBot for personalized meal suggestions based on what you've eaten recently.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-xl py-6">
        <div className="bg-white shadow-md rounded-lg p-6 min-h-[60vh]">
          <div className="flex flex-col items-stretch gap-4">
            <div className="overflow-y-auto max-h-[50vh] pr-2">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && getAvatar(msg.role)}
                  <div
                    className={`px-4 py-2 rounded-md max-w-[80%] ${msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}
                  >
                    {msg.role === 'assistant' ? (
                      <>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                        {idx === 0 && mealTable}
                      </>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {msg.timestamp}
                    </p>
                  </div>
                  {msg.role === 'user' && getAvatar(msg.role)}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start items-center gap-3 mb-2">
                  {getAvatar('assistant')}
                  <p className="text-sm text-gray-500">
                    NutriBot is thinking...
                  </p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {showYesPrompt && !loading && (
              <div className="text-center">
                <button
                  type="button"
                  className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
                  onClick={() => sendMessage('Yes')}
                >
                  Yes, suggest meals
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <Input
                placeholder="Ask a question or type yes..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
                disabled={loading}
              />
              <button type="button" className="rounded-md border border-red-500 px-3 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50" onClick={clearChat}>
                Clear Chat
              </button>
              <button
                type="button"
                className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-70"
                onClick={() => sendMessage()}
                disabled={loading}
              >
                {loading ? 'Sending' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Sidenav>
  );
};

export default Chat;
