console.log('app.jsx loading');

// Create safe placeholders for createRoot/render which may come from a UMD ReactDOM
let createRootFn = null;
let renderFn = null;

// make hooks available in outer scope — they were previously declared inside the try block
let useState, useEffect, useMemo, useRef;
// make Recharts components available in outer scope too
let AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer;

try {
    ({ useState, useEffect, useMemo, useRef } = React || {});
    // don't destructure from ReactDOM directly — it may be undefined in some environments
    const maybeReactDOM = (typeof ReactDOM !== 'undefined') ? ReactDOM : (typeof window !== 'undefined' ? window.ReactDOM : undefined);
    console.log('React, ReactDOM, Recharts:', typeof React, typeof maybeReactDOM, typeof Recharts);

    if (maybeReactDOM) {
        if (typeof maybeReactDOM.createRoot === 'function') createRootFn = maybeReactDOM.createRoot.bind(maybeReactDOM);
        if (typeof maybeReactDOM.render === 'function') renderFn = (el, container) => maybeReactDOM.render(el, container);
    }

    // Provide safe fallbacks if Recharts failed to load (prevents white screen)
    const RechartsAvailable = typeof Recharts !== 'undefined' && Recharts;
    const debugInfo = `R:${typeof React !== 'undefined'}, RD:${typeof ReactDOM !== 'undefined'}, PT:${typeof PropTypes !== 'undefined'}, RC:${typeof Recharts !== 'undefined'}`;

    AreaChart = RechartsAvailable ? Recharts.AreaChart : ({ children }) => React.createElement('div', { className: 'h-full flex flex-col items-center justify-center text-stone-400 text-xs' },
        React.createElement('span', null, 'Gráfico indisponível'),
        React.createElement('span', { className: 'text-[8px] opacity-50' }, debugInfo)
    );
    Area = RechartsAvailable ? Recharts.Area : () => null;
    XAxis = RechartsAvailable ? Recharts.XAxis : () => null;
    YAxis = RechartsAvailable ? Recharts.YAxis : () => null;
    CartesianGrid = RechartsAvailable ? Recharts.CartesianGrid : () => null;
    Tooltip = RechartsAvailable ? Recharts.Tooltip : () => null;
    ResponsiveContainer = RechartsAvailable ? Recharts.ResponsiveContainer : ({ children }) => React.createElement('div', { style: { width: '100%', height: '100%' } }, children);

    // rest of file continues below inside try block
} catch (e) {
    console.error('Error initializing libraries in app.jsx', e);
    throw e;
}

// --- Mock Inicial ---
const DEFAULT_TASKS = [
    { id: '1', title: 'Brainstorm Criativo', desc: 'Ideias para o novo app', time: '09:00', done: false, cat: 'Trabalho' },
    { id: '2', title: 'Reunião Mensal', desc: 'Alinhamento de metas', time: '11:00', done: true, cat: 'Trabalho' },
    { id: '3', title: 'Yoga Express', desc: '15 min de estica e puxa', time: '08:00', done: true, cat: 'Pessoal' },
    { id: '4', title: 'Comprar Tintas', desc: 'Azul e Amarelo para o quadro', time: '15:30', done: false, cat: 'Pessoal' },
    { id: '5', title: 'Limpar Mesa', desc: 'Organizar a bagunça real', time: '18:00', done: false, cat: 'Casa' }
];

const CHART_DATA = [
    { day: 'SEG', val: 4 }, { day: 'TER', val: 6 }, { day: 'QUA', val: 3 },
    { day: 'QUI', val: 7 }, { day: 'SEX', val: 2 }, { day: 'SÁB', val: 8 }, { day: 'DOM', val: 5 }
];

const CATEGORIES = {
    'Trabalho': { color: 'orange', icon: 'work' },
    'Pessoal': { color: 'purple', icon: 'person' },
    'Casa': { color: 'green', icon: 'home' },
    'Urgente': { color: 'red', icon: 'priority_high' }
};

const PRIVACY_POLICY = `Política de Privacidade\n\nEste aplicativo armazena localmente no seu dispositivo os dados de tarefas, perfil e configurações. As imagens de perfil selecionadas são guardadas localmente como data URLs. Não enviamos seus dados para servidores externos.\n\nVocê pode limpar seus dados a qualquer momento removendo tarefas ou limpando os dados do aplicativo nas configurações do dispositivo.\n\nContato: suporte@seudominio.com`;

const TERMS_OF_USE = `Termos de Uso\n\nAo utilizar este aplicativo, você concorda em usar as funcionalidades apenas para fins pessoais e não comerciais. O aplicativo é fornecido no estado em que se encontra, sem garantias expressas ou implícitas. Não nos responsabilizamos por perdas de dados; faça backups regularmente.\n\nVersão: 1.0`;

const Dashboard = ({ tasks }) => {
    const completed = tasks.filter(t => t.done).length;
    const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    return (
        <div className="space-y-6 animate-content">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-100 relative rotate-1 overflow-hidden">
                <div className="tape"></div>
                <div className="flex flex-col items-center text-center">
                    <div className="size-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-4xl text-orange-400 filled">emoji_events</span>
                    </div>
                    <h2 className="text-2xl font-black text-stone-800 tracking-tight leading-tight">Sua bagunça está<br />sob controle!</h2>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-2">Você concluiu {completed} tarefas hoje</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 flex flex-col items-center justify-center -rotate-1">
                    <div className="relative size-28 flex items-center justify-center">
                        <svg className="size-full -rotate-90">
                            <circle cx="56" cy="56" r="48" stroke="#f3f4f6" strokeWidth="10" fill="transparent" />
                            <circle cx="56" cy="56" r="48" stroke="#ee9d2b" strokeWidth="10" fill="transparent"
                                strokeDasharray="301.5" strokeDashoffset={301.5 - (301.5 * progress / 100)} strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                        </svg>
                        <span className="absolute text-2xl font-black text-stone-800">{progress}%</span>
                    </div>
                    <p className="mt-3 text-[10px] font-black text-stone-400 uppercase tracking-widest">Meta Diária</p>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 flex flex-col items-center justify-center rotate-1">
                    <span className="text-5xl font-black text-stone-800">{tasks.length}</span>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Total de Itens</p>
                    <div className="mt-3 px-3 py-1 bg-stone-50 rounded-full">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tight">Organizado</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 h-64">
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Meus Planejamentos</h1>
                    </div>
                    <button className="text-sm font-black text-stone-800 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-orange-400 text-xl filled">trending_up</span>
                        Fluxo Semanal
                    </button>
                </header>
                <ResponsiveContainer width="100%" height="70%">
                    <AreaChart data={CHART_DATA}>
                        <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ee9d2b" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#ee9d2b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#d1d5db' }} />
                        <Tooltip cursor={{ stroke: '#ee9d2b', strokeWidth: 2 }} contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="val" stroke="#ee9d2b" strokeWidth={4} fill="url(#colorVal)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const DailyList = ({ tasks, onToggle, onDelete }) => (
    <div className="space-y-4 animate-content pb-10">
        <div className="mb-8 flex justify-between items-end">
            <div>
                <h1 className="text-4xl font-black text-stone-800 tracking-tighter">Hoje</h1>
                <p className="text-stone-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Bagunça Planejada</p>
            </div>
            <div className="text-right">
                <p className="text-2xl font-black text-orange-400 leading-none">{tasks.filter(t => t.done).length}/{tasks.length}</p>
                <p className="text-[10px] font-bold text-stone-300 uppercase">Feito</p>
            </div>
        </div>

        <div className="relative pl-4 space-y-6">
            <div className="absolute left-[1.15rem] top-2 bottom-2 w-0.5 bg-stone-100 rounded-full"></div>
            {tasks.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center">
                    <div className="size-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mb-4 rotate-12">
                        <span className="material-symbols-outlined text-5xl">draw</span>
                    </div>
                    <p className="text-stone-300 font-bold">Nenhuma bagunça agendada!</p>
                    <p className="text-[10px] text-stone-200 uppercase font-black tracking-widest mt-1">Adicione algo no botão +</p>
                </div>
            ) : (
                tasks.sort((a, b) => a.time.localeCompare(b.time)).map((task, idx) => {
                    const config = CATEGORIES[task.cat] || CATEGORIES['Trabalho'];
                    return (
                        <div key={task.id} className="flex gap-6 items-start group">
                            <div className="z-10 bg-[#f8f7f6] py-1">
                                <div className={`size-3.5 rounded-full border-2 transition-all duration-500 ${task.done ? 'bg-orange-400 border-orange-400 scale-125' : 'bg-white border-stone-200'}`}></div>
                            </div>
                            <div
                                className={`flex-1 p-5 bg-white rounded-[2rem] border cursor-pointer paper-card shadow-sm ${idx % 2 === 0 ? 'rotate-1' : '-rotate-1'} ${task.done ? 'opacity-40 grayscale border-transparent' : 'border-stone-100'}`}
                                onClick={() => onToggle(task.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-black text-stone-800 bg-stone-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">{task.time}</span>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tight text-${config.color}-500 bg-${config.color}-50`}>
                                                {task.cat}
                                            </span>
                                        </div>
                                        <h4 className={`text-base font-black leading-tight ${task.done ? 'line-through decoration-orange-400/50' : 'text-stone-800'}`}>{task.title}</h4>
                                        {task.desc && <p className="text-xs text-stone-400 mt-2 font-medium">{task.desc}</p>}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className={`size-7 rounded-xl border-2 flex items-center justify-center transition-all ${task.done ? 'bg-orange-400 border-orange-400 rotate-12' : 'border-stone-100 rotate-0'}`}>
                                            {task.done && <span className="material-symbols-outlined text-white text-base font-black">check</span>}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                                            className="opacity-0 group-hover:opacity-100 size-7 flex items-center justify-center text-stone-200 hover:text-red-400 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
);

const App = () => {
    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem('minha-bagunca-tasks');
        return saved ? JSON.parse(saved) : DEFAULT_TASKS;
    });
    const [view, setView] = useState('daily');
    const [showAdd, setShowAdd] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', desc: '', time: '09:00', cat: 'Trabalho' });

    // profile: name + photo (data URL or remote URL)
    const [profile, setProfile] = useState(() => {
        const saved = localStorage.getItem('minha-bagunca-profile');
        return saved ? JSON.parse(saved) : { name: 'Mente Criativa', photo: 'https://picsum.photos/seed/artist/200' };
    });

    // reminders on/off
    const [remindersEnabled, setRemindersEnabled] = useState(() => {
        const s = localStorage.getItem('minha-bagunca-reminders');
        return s ? JSON.parse(s) : true;
    });

    // alarm sound object { uri, name, channelId }
    const [alarmSound, setAlarmSound] = useState(() => {
        const saved = localStorage.getItem('minha-bagunca-alarm-sound');
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch (e) {
            return { uri: saved, name: 'Música selecionada', channelId: 'alarm_channel_default' };
        }
    });

    const reminderTimeoutsRef = useRef([]);

    // persist profile and reminders setting
    useEffect(() => { localStorage.setItem('minha-bagunca-profile', JSON.stringify(profile)); }, [profile]);
    useEffect(() => { localStorage.setItem('minha-bagunca-reminders', JSON.stringify(remindersEnabled)); }, [remindersEnabled]);
    useEffect(() => { if (alarmSound) localStorage.setItem('minha-bagunca-alarm-sound', JSON.stringify(alarmSound)); }, [alarmSound]);
    // dark mode
    const [darkMode, setDarkMode] = useState(() => {
        const s = localStorage.getItem('minha-bagunca-dark');
        return s ? JSON.parse(s) : false;
    });
    useEffect(() => {
        localStorage.setItem('minha-bagunca-dark', JSON.stringify(darkMode));
        try {
            if (darkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
        } catch (e) { }
    }, [darkMode]);
    // document modal for Policies/Terms
    const [docModal, setDocModal] = useState({ show: false, title: '', content: '' });
    const openDoc = (title, content) => setDocModal({ show: true, title, content });

    useEffect(() => {
        localStorage.setItem('minha-bagunca-tasks', JSON.stringify(tasks));
    }, [tasks]);

    // helper to show notification (uses Web Notifications API when available)
    // in-app alert modal state (fallback when plugin/notification API not usable)
    const [alertModal, setAlertModal] = useState({ show: false, title: '', body: '' });

    const showNotification = (task) => {
        const title = task.title || 'Lembrete';
        const body = task.desc ? `${task.desc} — ${task.time}` : `Hora: ${task.time}`;
        console.log('showNotification called:', { title, body });

        // Play alarm sound if app is open
        if (alarmSound) {
            testAlarmSound();
        }

        // Try Cordova local notification plugin (Native)
        let nativeStatus = 'Não verificado';
        if (typeof window !== 'undefined' && window.cordova && window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local) {
            try {
                const local = window.cordova.plugins.notification.local;
                const nid = task.id ? (parseInt(String(task.id).replace(/[^\d]/g, '')) || Math.floor(Math.random() * 1000000)) : Math.floor(Math.random() * 1000000);

                console.log('Scheduling native notification:', nid);
                local.schedule({
                    id: nid,
                    title: title,
                    text: body,
                    foreground: true,
                    priority: 2,
                    wakeup: true,
                    vibrate: true,
                    sound: alarmSound?.uri || undefined,
                    channel: alarmSound?.channelId || 'reminders',
                    data: { taskId: task.id || null }
                });
                nativeStatus = 'Agendada via Plugin';
            } catch (e) {
                console.warn('Native notification failed:', e);
                nativeStatus = 'Erro no Plugin: ' + e.message;
            }
        } else {
            console.log('Native notification plugin NOT available');
            nativeStatus = 'Plugin não encontrado (Cordova)';
        }

        // Show the in-app modal (Always for internal confirmation)
        setAlertModal({ show: true, title, body });
    };

    // schedule reminders for tasks (simple in-memory scheduling while the app is running)
    const scheduleReminders = () => {
        // clear existing timers
        (reminderTimeoutsRef.current || []).forEach(id => clearTimeout(id));
        reminderTimeoutsRef.current = [];

        if (!remindersEnabled) return;

        const now = new Date();

        // If Cordova local notification plugin is available, cancel existing scheduled and use plugin
        const hasPlugin = typeof window !== 'undefined' && window.cordova && window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local;
        try {
            if (hasPlugin) {
                const local = window.cordova.plugins.notification.local;
                if (typeof local.cancelAll === 'function') {
                    try { local.cancelAll(); } catch (e) { /* ignore */ }
                }

                tasks.forEach(task => {
                    if (task.done || !task.time) return;
                    const [hh, mm] = (task.time || '00:00').split(':').map(n => parseInt(n, 10));
                    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh || 0, mm || 0, 0, 0);
                    if (target.getTime() <= now.getTime()) return;

                    const nid = parseInt(String(task.id).replace(/[^\d]/g, '')) || Math.floor(Math.random() * 1000000);

                    const notif = {
                        id: nid,
                        title: `Lembrete: ${task.title}`,
                        text: task.desc ? `${task.desc} — ${task.time}` : `Hora: ${task.time}`,
                        foreground: true,
                        priority: 2,
                        vibrate: true,
                        wakeup: true,
                        launch: true,
                        lockscreen: true,
                        channel: alarmSound?.channelId || 'reminders',
                        smallIcon: 'res://icon',
                        sound: alarmSound?.uri || undefined,
                        data: { taskId: task.id }
                    };

                    // Try modern 'trigger' API, fall back to older 'at' param
                    try {
                        local.schedule({ ...notif, trigger: { at: target } });
                    } catch (e1) {
                        try { local.schedule({ ...notif, at: target }); } catch (e2) { /* final fallback below */ }
                    }
                });
                return;
            }
        } catch (e) {
            console.warn('Local notification plugin scheduling failed, falling back to in-memory timers', e);
        }

        // Fallback: in-memory timers using Notification API or alert (works only while app is open)
        tasks.forEach(task => {
            if (task.done) return; // skip completed
            if (!task.time) return;
            const [hh, mm] = (task.time || '00:00').split(':').map(n => parseInt(n, 10));
            const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh || 0, mm || 0, 0, 0);
            if (target.getTime() <= now.getTime()) return;
            const delay = target.getTime() - now.getTime();
            const id = setTimeout(() => showNotification(task), delay);
            reminderTimeoutsRef.current.push(id);
        });
    };

    // reschedule whenever tasks or reminders setting change
    useEffect(() => {
        scheduleReminders();
        return () => { (reminderTimeoutsRef.current || []).forEach(id => clearTimeout(id)); reminderTimeoutsRef.current = []; };
    }, [tasks, remindersEnabled, profile]);

    // Unified Device & Permission Initialization
    useEffect(() => {
        const init = async () => {
            const onReady = async () => {
                console.log('Device Ready - Initializing...');
                const permissions = window.cordova && window.cordova.plugins && window.cordova.plugins.permissions;

                if (permissions) {
                    const list = [
                        permissions.WRITE_EXTERNAL_STORAGE,
                        permissions.READ_EXTERNAL_STORAGE,
                        permissions.POST_NOTIFICATIONS
                    ];

                    // Check if we already have ALL permissions
                    const checkPermissions = () => new Promise((res) => {
                        let missing = [];
                        let checked = 0;
                        list.forEach(p => {
                            permissions.hasPermission(p, (status) => {
                                if (!status || !status.hasPermission) missing.push(p);
                                checked++;
                                if (checked === list.length) res(missing);
                            }, () => {
                                missing.push(p);
                                checked++;
                                if (checked === list.length) res(missing);
                            });
                        });
                    });

                    const missingBlocks = await checkPermissions();
                    if (missingBlocks.length > 0) {
                        console.log('Missing permissions:', missingBlocks);
                        permissions.requestPermissions(missingBlocks, (status) => {
                            if (status && status.hasPermission) console.log('Permissions granted');
                            else console.warn('Some permissions denied');
                            scheduleReminders(); // Always try to schedule
                        });
                    } else {
                        console.log('All permissions already granted');
                        scheduleReminders();
                    }
                } else {
                    scheduleReminders();
                }
            };

            if (window.cordova) {
                document.addEventListener('deviceready', onReady, false);
                // Listen for notification triggers
                if (window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local) {
                    window.cordova.plugins.notification.local.on('trigger', (notification) => {
                        console.log('Notification triggered:', notification);
                        if (alarmSound && alarmSound.uri) {
                            if (typeof Media !== 'undefined') {
                                const m = new Media(alarmSound.uri, () => m.release(), (err) => console.error('Media error:', err));
                                m.play();
                            }
                        }
                    });
                }
            } else {
                // Browser fallback
                setTimeout(scheduleReminders, 1000);
            }
        };
        init();
    }, [tasks, remindersEnabled]); // Reschedule if settings change


    const toggleTask = (id) => {
        setTasks((prev) => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    };

    const deleteTask = (id) => {
        setTasks((prev) => prev.filter(t => t.id !== id));
    };

    const handleAddTask = () => {
        if (!newTask.title) return;
        const task = { ...newTask, id: Math.random().toString(36).substr(2, 9), done: false };
        setTasks([...tasks, task]);
        setShowAdd(false);
        setNewTask({ title: '', desc: '', time: '09:00', cat: 'Trabalho' });
    };


    const handleProfileFile = (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => setProfile(prev => ({ ...prev, photo: reader.result }));
        reader.readAsDataURL(f);
    };

    const saveLocalSound = (sourceUri, fileName) => {
        return new Promise((resolve, reject) => {
            if (!window.resolveLocalFileSystemURL) {
                resolve(sourceUri); // Fallback to original
                return;
            }

            console.log('Copying file to local storage...', sourceUri);
            window.resolveLocalFileSystemURL(sourceUri, (fileEntry) => {
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, (dirEntry) => {
                    const newName = `custom_alarm_${Date.now()}_${fileName.replace(/[^a-z0-9.]/gi, '_')}`;
                    fileEntry.copyTo(dirEntry, newName, (copiedEntry) => {
                        console.log('File copied to:', copiedEntry.nativeURL);
                        resolve(copiedEntry.nativeURL);
                    }, reject);
                }, reject);
            }, (err) => {
                // If the source URI cannot be resolved directly (common with content://), 
                // we might need to use xhr to get the blob and save it if chooser didn't provide it.
                // But cordova-plugin-chooser usually provides a reachable URI.
                resolve(sourceUri);
            });
        });
    };

    const handlePickAlarmSound = () => {
        if (typeof window !== 'undefined' && window.chooser) {
            window.chooser.getFile('audio/*')
                .then(async (file) => {
                    if (file) {
                        try {
                            const localUri = await saveLocalSound(file.uri, file.name);
                            const newChannelId = `alarm_ch_${Date.now()}`;
                            console.log('Selected alarm sound:', file.name, localUri, newChannelId);
                            setAlarmSound({ uri: localUri, name: file.name, channelId: newChannelId });
                        } catch (e) {
                            console.error('Copy failed, using original URI:', e);
                            setAlarmSound({ uri: file.uri, name: file.name, channelId: `alarm_ch_${Date.now()}` });
                        }
                    }
                })
                .catch((err) => {
                    console.error('Error picking file:', err);
                    setAlertModal({ show: true, title: 'Erro', body: 'Não foi possível selecionar o arquivo.' });
                });
        } else {
            console.warn('Chooser plugin not available');
            setAlertModal({ show: true, title: 'Erro', body: 'Recurso de seleção de arquivos não disponível no seu dispositivo.' });
        }
    };

    const testAlarmSound = () => {
        if (!alarmSound || !alarmSound.uri) {
            setAlertModal({ show: true, title: 'Aviso', body: 'Nenhuma música selecionada.' });
            return;
        }
        if (typeof Media !== 'undefined') {
            const m = new Media(alarmSound.uri, () => m.release(), (err) => console.error('Media error:', err));
            m.play();
            // stop after 10 seconds for testing
            setTimeout(() => m.stop(), 10000);
        } else {
            const audio = new Audio(alarmSound.uri);
            audio.play();
            setTimeout(() => audio.pause(), 10000);
        }
    };


    return (
        <div className="app-root w-full min-h-screen flex flex-col paper-bg shadow-2xl relative bg-[#f8f7f6]">

            <header className="flex items-center justify-between px-6 pt-8 pb-4 sticky top-0 bg-[#f8f7f6]/90 backdrop-blur-xl z-30">
                <button
                    onClick={() => setView('dashboard')}
                    className={`size-11 flex items-center justify-center rounded-2xl transition-all shadow-sm border ${view === 'dashboard' ? 'bg-stone-800 border-stone-800 text-white rotate-6' : 'bg-white border-stone-100 text-stone-400'}`}
                >
                    <span className="material-symbols-outlined">grid_view</span>
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-xl font-black text-stone-800 tracking-tighter uppercase italic">Minha Bagunça</span>
                    <div className="h-1.5 w-10 bg-orange-400 rounded-full mt-1 -rotate-2"></div>
                </div>
                <button
                    onClick={() => setView('settings')}
                    className={`size-11 rounded-2xl overflow-hidden border-2 transition-all ${view === 'settings' ? 'border-orange-400 scale-110 -rotate-6' : 'border-white'}`}
                >
                    <img src={profile.photo} className="size-full object-cover" alt="Perfil" />
                </button>
            </header>

            <main className="flex-1 px-6 pt-6 pb-32 overflow-y-auto no-scrollbar">
                {view === 'dashboard' && <Dashboard tasks={tasks} />}
                {view === 'daily' && <DailyList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} />}
                {view === 'calendar' && (
                    <div className="bg-white p-10 rounded-[3rem] border border-stone-100 animate-content shadow-sm rotate-1 relative">
                        <div className="tape"></div>
                        <h3 className="font-black text-center text-stone-800 text-xl mb-8 tracking-tight">Outubro 2023</h3>
                        <div className="grid grid-cols-7 gap-y-4 text-center">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d} className="text-[11px] font-black text-stone-200 uppercase">{d}</div>)}
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                                const isToday = day === 24;
                                return (
                                    <div key={day} className={`p-2 text-sm font-black relative flex items-center justify-center ${isToday ? 'text-white' : 'text-stone-400'}`}>
                                        {isToday && <div className="absolute inset-0 bg-orange-400 rounded-2xl rotate-6 -z-10 shadow-xl shadow-orange-100"></div>}
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {view === 'settings' && (
                    <div className="space-y-6 animate-content">
                        <div className="bg-white p-8 rounded-[3rem] border border-stone-100 flex flex-col items-center gap-4 text-center">
                            <div className="size-24 rounded-[2rem] overflow-hidden rotate-6 shadow-xl border-4 border-white">
                                <img src={profile.photo} className="size-full object-cover" alt="avatar" />
                            </div>
                            <div className="w-full">
                                <input
                                    type="text"
                                    value={profile.name}
                                    onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full text-2xl font-black bg-white rounded-[2rem] border-none shadow-sm p-4 text-center"
                                />
                                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-2 text-center">Plano Bagunça Premium</p>
                                <div className="mt-4 flex gap-3 justify-center">
                                    <input id="profile-file" type="file" accept="image/*" onChange={handleProfileFile} style={{ display: 'none' }} />
                                    <button onClick={() => document.getElementById('profile-file').click()} className="py-2 px-4 bg-stone-100 rounded-full text-sm font-bold">Mudar foto</button>
                                    <button onClick={() => { localStorage.removeItem('minha-bagunca-profile'); setProfile({ name: 'Mente Criativa', photo: 'https://picsum.photos/seed/artist/200' }); }} className="py-2 px-4 bg-stone-50 rounded-full text-sm font-bold">Restaurar</button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-[3rem] border border-stone-100 overflow-hidden divide-y divide-stone-50">
                            <div className="p-6 flex flex-col gap-4 hover:bg-stone-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center">
                                            <span className="material-symbols-outlined filled">notifications</span>
                                        </div>
                                        <span className="text-sm font-black text-stone-700">Lembretes</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="switch small">
                                            <input type="checkbox" checked={remindersEnabled} onChange={e => setRemindersEnabled(e.target.checked)} />
                                            <span className="slider"></span>
                                        </label>
                                        <span className="switch-label">{remindersEnabled ? 'Ativado' : 'Desativado'}</span>
                                        <button onClick={() => showNotification({ title: 'Teste', desc: 'Notificação de teste', time: new Date().toLocaleTimeString() })} className="btn-ghost">Testar Notif.</button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pl-14">
                                    <div className="flex-1 pr-4">
                                        <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-1">Arquivo Selecionado</p>
                                        <p className="text-xs font-black text-stone-600 truncate max-w-[140px]">
                                            {alarmSound ? alarmSound.name : 'Padrão do sistema'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handlePickAlarmSound} className="py-2.5 px-4 bg-stone-100 rounded-2xl text-[10px] font-black uppercase tracking-tight text-stone-600 active:scale-95 transition-all">Escolher</button>
                                        {alarmSound && <button onClick={testAlarmSound} className="py-2.5 px-4 bg-orange-100 rounded-2xl text-[10px] font-black uppercase tracking-tight text-orange-400 active:scale-95 transition-all">Ouvir</button>}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-2xl bg-stone-50 text-stone-400 flex items-center justify-center">
                                        <span className="material-symbols-outlined filled">dark_mode</span>
                                    </div>
                                    <span className="text-sm font-black text-stone-700">Modo Escuro</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="switch small">
                                        <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />
                                        <span className="slider"></span>
                                    </label>
                                    <span className="switch-label">{darkMode ? 'Ativado' : 'Desativado'}</span>
                                </div>
                            </div>
                            <div className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => openDoc('Política de Privacidade', PRIVACY_POLICY)}>
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-2xl bg-stone-50 text-stone-400 flex items-center justify-center">
                                        <span className="material-symbols-outlined filled">policy</span>
                                    </div>
                                    <span className="text-sm font-black text-stone-700">Política de Privacidade</span>
                                </div>
                                <div className="text-sm text-stone-300">Abrir</div>
                            </div>

                            <div className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => openDoc('Termos de Uso', TERMS_OF_USE)}>
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-2xl bg-stone-50 text-stone-400 flex items-center justify-center">
                                        <span className="material-symbols-outlined filled">description</span>
                                    </div>
                                    <span className="text-sm font-black text-stone-700">Termos de Uso</span>
                                </div>
                                <div className="text-sm text-stone-300">Abrir</div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 w-full h-24 bg-white/90 backdrop-blur-2xl border-t border-stone-50 shadow-[0_-20px_50px_rgba(0,0,0,0.04)] z-40 px-6 md:px-10 flex items-center justify-around">
                {[
                    { id: 'dashboard', icon: 'auto_graph' },
                    { id: 'daily', icon: 'format_list_bulleted' },
                    { id: 'calendar', icon: 'calendar_today' },
                    { id: 'settings', icon: 'settings' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setView(tab.id)} className={`transition-all duration-300 ${view === tab.id ? 'tab-active' : 'tab-inactive'}`}>
                        <span className={`material-symbols-outlined text-3xl ${view === tab.id ? 'filled' : ''}`}>{tab.icon}</span>
                    </button>
                ))}
            </nav>

            <button
                onClick={() => setShowAdd(true)}
                className="fixed bottom-28 right-8 size-16 bg-orange-400 text-white rounded-[2rem] shadow-2xl shadow-orange-200 flex items-center justify-center hover:scale-110 active:scale-90 transition-all rotate-12 border-4 border-white z-50 group"
            >
                <span className="material-symbols-outlined text-4xl font-black group-hover:rotate-90 transition-transform duration-500">add</span>
            </button>

            {showAdd && (
                <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex flex-col justify-end" onClick={() => setShowAdd(false)}>
                    <div className="bg-white modal-card rounded-t-[4rem] p-10 animate-content shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-3xl font-black text-stone-800 tracking-tighter">Nova Bagunça</h3>
                            <button onClick={() => setShowAdd(false)} className="size-10 rounded-full bg-white flex items-center justify-center text-stone-300 border border-stone-100">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">O que vamos bagunçar?</p>
                                <input
                                    type="text"
                                    placeholder="Ex: Pintar o mundo"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full text-2xl font-black bg-white rounded-[2rem] border-none shadow-sm focus:ring-4 focus:ring-orange-100 p-6 placeholder:text-stone-300"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Horário</p>
                                    <input
                                        type="time"
                                        value={newTask.time}
                                        onChange={e => setNewTask({ ...newTask, time: e.target.value })}
                                        className="w-full font-black bg-white rounded-[2rem] border-none shadow-sm p-6 focus:ring-4 focus:ring-orange-100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Categoria</p>
                                    <select
                                        value={newTask.cat}
                                        onChange={e => setNewTask({ ...newTask, cat: e.target.value })}
                                        className="w-full font-black bg-white rounded-[2rem] border-none shadow-sm p-6 focus:ring-4 focus:ring-orange-100 appearance-none"
                                    >
                                        {Object.keys(CATEGORIES).map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={handleAddTask}
                                className="w-full py-6 bg-orange-400 text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-orange-100 active:scale-95 transition-all mt-4 hover:bg-stone-800"
                            >
                                Confirmar Bagunça
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* In-app alert modal (fallback) */}
            {alertModal.show && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAlertModal({ show: false, title: '', body: '' })}></div>
                    <div className="relative w-[92%] max-w-lg bg-white dark:bg-[#0f1724] modal-card rounded-2xl shadow-2xl p-6 mx-4">
                        <h3 className="text-lg font-black text-stone-800 dark:text-white mb-2">{alertModal.title}</h3>
                        <p className="text-sm text-stone-500 dark:text-stone-300 mb-6">{alertModal.body}</p>
                        <div className="flex justify-end">
                            <button onClick={() => setAlertModal({ show: false, title: '', body: '' })} className="btn-primary">OK</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Document modal for Privacy / Terms */}
            {docModal.show && (
                <div className="fixed inset-0 z-[115] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setDocModal({ show: false, title: '', content: '' })}></div>
                    <div className="relative w-[94%] max-w-2xl bg-white dark:bg-[#071025] modal-card rounded-2xl shadow-2xl p-0 mx-4 max-h-[86vh] overflow-hidden">
                        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black text-stone-800 dark:text-white mb-1">{docModal.title}</h3>
                                <p className="text-xs text-stone-400 dark:text-stone-300">Última atualização: {new Date().toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setDocModal({ show: false, title: '', content: '' })} className="size-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-auto max-h-[68vh]">
                            <article className="prose prose-sm max-w-none text-stone-700 dark:text-stone-200 leading-relaxed">
                                {String(docModal.content || '').split('\n\n').map((par, i) => (
                                    <div key={i} className="doc-paragraph"><p className="m-0">{par}</p></div>
                                ))}
                            </article>
                        </div>
                        <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex justify-end bg-stone-50 dark:bg-transparent">
                            <button onClick={() => setDocModal({ show: false, title: '', content: '' })} className="py-2 px-6 btn-primary">Fechar</button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

try {
    const container = document.getElementById('root');
    if (!container) throw new Error('Root container not found');

    if (createRootFn) {
        const root = createRootFn(container);
        root.render(<App />);
    } else if (renderFn) {
        renderFn(<App />, container);
    } else if (typeof window !== 'undefined' && window.__appErrors !== undefined) {
        window.__appErrors.push('No ReactDOM.createRoot or ReactDOM.render available. Ensure React/ReactDOM are loaded.');
        throw new Error('No ReactDOM.createRoot or ReactDOM.render available.');
    } else {
        throw new Error('No ReactDOM.createRoot or ReactDOM.render available.');
    }

    console.log('App rendered');
} catch (e) {
    console.error('Render error', e);
    if (typeof window !== 'undefined' && window.__appErrors !== undefined) {
        try { window.__appErrors.push(String(e)); } catch (_) { }
    }
    throw e;
    throw e;
}
