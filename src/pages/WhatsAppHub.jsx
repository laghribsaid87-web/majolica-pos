import React, { useState, useEffect, useRef } from 'react';
import { subscribeToWhatsAppLogs, sendAndLogWhatsAppMessage } from '../services/api';
import { Send, CheckCircle2, XCircle, Clock, Search, MessageSquarePlus, User } from 'lucide-react';

const WhatsAppHub = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToWhatsAppLogs((data) => {
      setLogs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, selectedContact]);

  // Grouper les messages par contact
  const contactsMap = {};
  logs.forEach(log => {
    const phone = log.to;
    if (!contactsMap[phone]) {
      contactsMap[phone] = {
        phone,
        messages: [],
        lastMessage: null,
        lastTimestamp: 0
      };
    }
    contactsMap[phone].messages.push(log);
    
    const timestamp = new Date(log.timestamp).getTime();
    if (timestamp > contactsMap[phone].lastTimestamp) {
      contactsMap[phone].lastTimestamp = timestamp;
      contactsMap[phone].lastMessage = log;
    }
  });

  const contactsList = Object.values(contactsMap)
    .filter(c => c.phone.includes(searchQuery))
    .sort((a, b) => b.lastTimestamp - a.lastTimestamp);

  const activeContactData = selectedContact ? contactsMap[selectedContact] : null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedContact || !message.trim()) return;
    
    const currentMessage = message;
    setMessage('');
    setSending(true);
    try {
      await sendAndLogWhatsAppMessage(selectedContact, currentMessage);
    } catch (error) {
      alert("Échec d'envoi. Veuillez vérifier la connexion WhatsApp dans les Paramètres.\n" + error.message);
    }
    setSending(false);
  };

  const handleStartNewChat = (e) => {
    e.preventDefault();
    if (!newContactPhone) return;
    setSelectedContact(newContactPhone);
    setIsNewChatModalOpen(false);
    setNewContactPhone('');
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' });
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'sent': return <CheckCircle2 className="text-blue-500" size={14} />;
      case 'received': return null;
      case 'error': return <XCircle className="text-red-500" size={14} />;
      default: return <Clock className="text-gray-400" size={14} />;
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex rounded-2xl shadow-lg border border-gray-200 overflow-hidden bg-white">
      
      {/* Sidebar - Contacts */}
      <div className="w-1/3 min-w-[300px] border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 bg-gray-100 flex items-center justify-between border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Discussions</h2>
          <button 
            onClick={() => setIsNewChatModalOpen(true)}
            className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors"
            title="Nouvelle discussion"
          >
            <MessageSquarePlus size={20} />
          </button>
        </div>

        <div className="p-3 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un numéro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Chargement...</div>
          ) : contactsList.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Aucune discussion</div>
          ) : (
            contactsList.map((contact) => (
              <div
                key={contact.phone}
                onClick={() => setSelectedContact(contact.phone)}
                className={`flex items-center p-4 cursor-pointer border-b border-gray-100 transition-colors ${
                  selectedContact === contact.phone ? 'bg-emerald-50' : 'hover:bg-gray-100 bg-white'
                }`}
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 shrink-0">
                  <User size={24} />
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{contact.phone}</h3>
                    <span className="text-xs text-gray-500 shrink-0 ml-2">
                      {contact.lastMessage ? formatDate(contact.lastMessage.timestamp) : ''}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    {contact.lastMessage?.status && contact.lastMessage.status !== 'received' && (
                      <span className="mr-1">{getStatusIcon(contact.lastMessage.status)}</span>
                    )}
                    <p className="truncate">{contact.lastMessage?.body || ''}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Zone de Chat */}
      <div className="flex-1 flex flex-col bg-[#efeae2]">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-gray-100 flex items-center border-b border-gray-200">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white shrink-0">
                <User size={20} />
              </div>
              <div className="ml-4">
                <h3 className="font-bold text-gray-900">{selectedContact}</h3>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {activeContactData?.messages.map((msg, index) => {
                const isSentByMe = msg.status !== 'received'; // 'received' sera le statut pour les msgs entrants
                return (
                  <div key={msg.id || index} className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[70%] rounded-lg p-3 shadow-sm relative ${
                        isSentByMe ? 'bg-[#d9fdd3]' : 'bg-white'
                      }`}
                    >
                      <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] text-gray-500">{formatTime(msg.timestamp)}</span>
                        {isSentByMe && getStatusIcon(msg.status)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-gray-100 border-t border-gray-200">
              <form onSubmit={handleSend} className="flex items-end gap-3">
                <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder="Taper un message..."
                    className="w-full p-4 outline-none resize-none max-h-32"
                    rows="1"
                    style={{ minHeight: '50px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!message.trim() || sending}
                  className="p-4 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f0f2f5]">
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <MessageSquarePlus size={48} className="text-gray-400" />
            </div>
            <h2 className="text-3xl font-light text-gray-700 mb-4">Hub WhatsApp</h2>
            <p className="text-gray-500 max-w-md">
              Envoyez et recevez des messages WhatsApp directement depuis Majolica POS sans avoir besoin de votre téléphone.
            </p>
          </div>
        )}
      </div>

      {/* Modal Nouvelle Discussion */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">Nouvelle Discussion</h3>
              <button onClick={() => setIsNewChatModalOpen(false)} className="text-gray-500 hover:text-gray-800">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleStartNewChat} className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro de téléphone</label>
              <input
                type="text"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                placeholder="Ex: 212661800728"
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-emerald-500 outline-none mb-6"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newContactPhone.trim()}
                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50"
              >
                Démarrer la discussion
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default WhatsAppHub;
