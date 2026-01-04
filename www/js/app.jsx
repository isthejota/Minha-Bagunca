// Firebase Compat imports are handled in index.html via script tags
// We use the global 'firebase' object directly

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
    'Trabalho': { color: 'brand', icon: 'work' },
    'Pessoal': { color: 'purple', icon: 'person' },
    'Casa': { color: 'green', icon: 'home' },
    'Urgente': { color: 'red', icon: 'priority_high' }
};

const PRIVACY_POLICY = `Política de Privacidade\n\nEste aplicativo armazena localmente no seu dispositivo os dados de tarefas, perfil e configurações. As imagens de perfil selecionadas são guardadas localmente como data URLs. Não enviamos seus dados para servidores externos.\n\nVocê pode limpar seus dados a qualquer momento removendo tarefas ou limpando os dados do aplicativo nas configurações do dispositivo.\n\nContato: suporte@seudominio.com`;

const TERMS_OF_USE = `Termos de Uso\n\nAo utilizar este aplicativo, você concorda em usar as funcionalidades apenas para fins pessoais e não comerciais. O aplicativo é fornecido no estado em que se encontra, sem garantias expressas ou implícitas. Não nos responsabilizamos por perdas de dados; faça backups regularmente.\n\nVersão: 1.0.2`;

const Dashboard = ({ tasks, goals, onAddGoal, onDeleteGoal, darkMode }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysTasks = tasks.filter(t => (t.date === todayStr || (!t.date && !t.recurring)) && t.type !== 'note');
    const completed = todaysTasks.filter(t => t.done).length;
    const progress = todaysTasks.length > 0 ? Math.round((completed / todaysTasks.length) * 100) : 0;

    const weeklyData = useMemo(() => {
        const labels = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
        const data = labels.map(day => ({ day, val: 0 }));

        const now = new Date();
        const currentDay = now.getDay(); // 0 (Dom) to 6 (Sab)
        const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));

        tasks.forEach(task => {
            if (!task.date || task.type === 'note') return;
            const taskDate = new Date(task.date + 'T00:00:00');
            const weekDiff = Math.floor((taskDate - monday) / (1000 * 60 * 60 * 24));

            if (weekDiff >= 0 && weekDiff < 7) {
                data[weekDiff].val++;
            }
        });

        return data;
    }, [tasks]);

    return (
        <div className="space-y-6 animate-content pb-10">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-stone-100 dark:border-zinc-800 relative rotate-1 overflow-hidden">
                <div className="tape"></div>
                <div className="flex flex-col items-center text-center relative z-20">
                    <div className="size-16 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-brand/20" style={{ background: 'var(--primary-gradient)' }}>
                        <span className="material-symbols-outlined text-4xl text-white filled">emoji_events</span>
                    </div>
                    <h2 className="text-2xl font-black text-stone-800 dark:text-zinc-100 tracking-tight leading-tight">Sua bagunça está<br />sob controle!</h2>
                    <p className="text-xs text-stone-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-2">Você concluiu {completed} tarefas hoje</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 flex flex-col items-center justify-center -rotate-1">
                    <div className="relative size-28 flex items-center justify-center">
                        <svg className="size-full -rotate-90">
                            <circle cx="56" cy="56" r="48" stroke="currentColor" className="text-stone-100 dark:text-zinc-800" strokeWidth="10" fill="transparent" />
                            <circle cx="56" cy="56" r="48" stroke="var(--primary)" strokeWidth="10" fill="transparent"
                                strokeDasharray="301.5" strokeDashoffset={301.5 - (301.5 * progress / 100)} strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                        </svg>
                        <span className="absolute text-2xl font-black text-stone-800 dark:text-zinc-100">{progress}%</span>
                    </div>
                    <p className="mt-3 text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest">Meta Diária</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 flex flex-col items-center justify-center rotate-1">
                    <span className="text-5xl font-black text-stone-800 dark:text-zinc-100">{todaysTasks.length}</span>
                    <p className="text-[10px] font-black text-stone-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Total de Itens</p>
                    <div className="mt-3 px-3 py-1 bg-stone-50 dark:bg-zinc-800 rounded-full">
                        <span className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-tight">Organizado</span>
                    </div>
                </div>
            </div>

            {/* Minhas Metas */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-stone-100 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-black text-stone-800 dark:text-zinc-100 tracking-tight">Minhas Metas</h3>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Conquistas do Mês</p>
                    </div>
                    <button onClick={onAddGoal} className="size-10 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 active:scale-90 transition-all">
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>
                <div className="space-y-4">
                    {goals.length === 0 ? (
                        <div className="text-center py-6 opacity-40">
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Nenhuma meta definida</p>
                        </div>
                    ) : (
                        goals.map(goal => (
                            <div key={goal.id} className="bg-stone-50 dark:bg-zinc-800/40 p-5 rounded-[2rem] border border-stone-100 dark:border-zinc-800">
                                <div className="flex justify-between mb-2">
                                    <p className="text-xs font-black text-stone-800 dark:text-zinc-100">{goal.title}</p>
                                    <div className="flex items-center gap-3">
                                        <p className="text-[10px] font-black text-brand">{goal.progress}%</p>
                                        <button onClick={() => onDeleteGoal(goal.id)} className="text-stone-300 hover:text-red-500 transition-colors active:scale-90">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="w-full bg-stone-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-brand h-full rounded-full shadow-sm" style={{ width: `${goal.progress}%` }}></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 h-64">
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">Meus Planejamentos</h1>
                    </div>
                    <button className="text-sm font-black text-stone-800 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-brand text-xl filled">trending_up</span>
                        Fluxo Semanal
                    </button>
                </header>
                <ResponsiveContainer width="100%" height="70%">
                    <AreaChart data={weeklyData}>
                        <defs>
                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-color)" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-color)', fontSize: 10, fontWeight: 'bold' }} />
                        <YAxis hide />
                        <Tooltip
                            cursor={{ stroke: 'var(--primary)', strokeWidth: 2 }}
                            contentStyle={{
                                borderRadius: '1.5rem',
                                border: 'none',
                                backgroundColor: darkMode ? '#18181b' : '#ffffff',
                                color: darkMode ? '#f4f4f5' : '#111827',
                                boxShadow: '0 10px 25px var(--primary-shadow)',
                                fontWeight: 'bold'
                            }}
                            itemStyle={{ color: 'var(--primary)' }}
                        />
                        <Area type="monotone" dataKey="val" stroke="var(--primary)" strokeWidth={4} fill="url(#colorVal)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const Login = ({ onGoogleLogin, onEmailLogin, onEmailRegister }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isRegistering) {
            onEmailRegister(name, email, password);
        } else {
            onEmailLogin(email, password);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white dark:bg-zinc-900 animate-content overflow-y-auto">
            <div className="size-24 bg-brand rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-brand/30 mb-6 rotate-3 flex-shrink-0">
                <span className="material-symbols-outlined text-5xl text-white filled">draw</span>
            </div>
            <h1 className="text-3xl font-black text-stone-800 dark:text-zinc-100 tracking-tighter mb-1">Minha Bagunça</h1>
            <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] mb-8">Organize sua criatividade</p>

            <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
                {isRegistering && (
                    <div className="space-y-1 text-left">
                        <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-4">Nome Completo</p>
                        <input
                            type="text"
                            placeholder="Seu Nome"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="w-full py-4 px-6 bg-stone-50 dark:bg-zinc-800 rounded-[1.5rem] border-none shadow-sm focus:ring-2 focus:ring-brand text-sm dark:text-white"
                        />
                    </div>
                )}
                <div className="space-y-1 text-left">
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-4">E-mail</p>
                    <input
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full py-4 px-6 bg-stone-50 dark:bg-zinc-800 rounded-[1.5rem] border-none shadow-sm focus:ring-2 focus:ring-brand text-sm dark:text-white"
                    />
                </div>
                <div className="space-y-1 text-left">
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest ml-4">Senha</p>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="w-full py-4 px-6 bg-stone-50 dark:bg-zinc-800 rounded-[1.5rem] border-none shadow-sm focus:ring-2 focus:ring-brand text-sm dark:text-white"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-4 bg-brand text-white rounded-[1.5rem] font-black text-base shadow-lg active:scale-95 transition-all hover:brightness-110"
                >
                    {isRegistering ? 'Criar Conta' : 'Entrar'}
                </button>
            </form>

            <div className="w-full max-w-xs flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-stone-100 dark:bg-zinc-800"></div>
                <span className="text-[10px] font-black text-stone-300 uppercase">ou</span>
                <div className="flex-1 h-px bg-stone-100 dark:bg-zinc-800"></div>
            </div>

            <button
                type="button"
                onClick={onGoogleLogin}
                className="w-full max-w-xs py-4 bg-white dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 rounded-[1.5rem] font-black text-base shadow-md border border-stone-100 dark:border-zinc-700 active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-stone-50 dark:hover:bg-zinc-700"
            >
                <img src="https://i.imgur.com/AIXUWKt.png" className="size-5" alt="Google" />
                Google
            </button>

            <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="mt-8 text-xs font-bold text-brand uppercase tracking-widest hover:underline"
            >
                {isRegistering ? 'Já tem conta? Faça Login' : 'Não tem conta? Cadastre-se'}
            </button>

            <p className="mt-8 text-[9px] text-stone-300 dark:text-zinc-600 font-black uppercase tracking-[0.2em]">Sincronize sua bagunça na nuvem</p>
        </div>
    );
};

const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-zinc-900">
        <div className="size-16 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-stone-400 font-black uppercase tracking-widest text-[10px]">Arrumando a bagunça...</p>
    </div>
);

const DailyList = ({ tasks, onToggle, onDelete, onEdit, darkMode }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysTasks = tasks.sort((a, b) => a.time.localeCompare(b.time)).filter(t => (t.date === todayStr || (!t.date && !t.recurring)) && t.type !== 'note');

    return (
        <div className="space-y-6 animate-content">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-stone-100 dark:border-zinc-800">
                <div className="flex items-center gap-4 mb-6">
                    <div className="size-12 rounded-2xl bg-brand-light dark:bg-brand-shadow flex items-center justify-center text-brand">
                        <span className="material-symbols-outlined text-2xl filled">checklist</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-stone-800 dark:text-zinc-100 tracking-tight">Lista Diária</h2>
                        <p className="text-xs text-stone-400 dark:text-zinc-500 font-bold uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {todaysTasks.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <span className="material-symbols-outlined text-4xl mb-2">thumb_up</span>
                            <p className="text-sm font-bold">Tudo limpo por aqui!</p>
                        </div>
                    ) : (
                        todaysTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                    <button
                                        onClick={() => onToggle(task.id)}
                                        className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.done ? 'bg-brand border-brand' : 'border-stone-300 dark:border-zinc-600'}`}
                                    >
                                        {task.done && <span className="material-symbols-outlined text-sm text-white font-black">check</span>}
                                    </button>
                                    <div className="min-w-0 text-left flex-1" onClick={() => onEdit(task)}>
                                        <p className={`text-sm font-bold truncate ${task.done ? 'text-stone-400 line-through' : 'text-stone-700 dark:text-zinc-200'}`}>{task.title}</p>
                                        <p className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider">{task.time} • {task.cat}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => onEdit(task)} className="size-8 rounded-full flex items-center justify-center text-stone-400 hover:text-brand transition-colors">
                                        <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button onClick={() => onDelete(task.id)} className="size-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const CalendarView = ({ tasks, goals, onDeleteGoal, onToggleTask, onDeleteTask, darkMode, onOpenAdd, onEditTask, isPremium, onLockClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState(isPremium ? 'Agenda' : 'Mês');

    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month, year) => {
        const day = new Date(year, month, 1).getDay();
        return (day + 6) % 7; // Ajusta para Segunda ser o primeiro dia (0=Seg, ..., 6=Dom)
    };

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const handlePrev = () => {
        const d = new Date(currentDate);
        if (viewMode === 'Dia') d.setDate(d.getDate() - 1);
        else if (viewMode === 'Semana' || viewMode === 'Agenda') d.setDate(d.getDate() - 7);
        else d.setMonth(d.getMonth() - 1);
        setCurrentDate(d);
    };

    const handleNext = () => {
        const d = new Date(currentDate);
        if (viewMode === 'Dia') d.setDate(d.getDate() + 1);
        else if (viewMode === 'Semana' || viewMode === 'Agenda') d.setDate(d.getDate() + 7);
        else d.setMonth(d.getMonth() + 1);
        setCurrentDate(d);
    };

    const days = Array.from({ length: daysInMonth(month, year) }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth(month, year) }, (_, i) => i);
    const today = new Date();
    const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const getTasksForDay = (d) => {
        const dateStr = typeof d === 'number'
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            : d;
        return tasks.filter(t => t.date === dateStr);
    };

    // Fix ReferenceError: todaysTasks is not defined
    // We reuse the logic from Dashboard/DailyList to identify today's tasks
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysTasks = tasks.filter(t => (t.date === todayStr || (!t.date && !t.recurring)) && t.type !== 'note');

    return (
        <div className="space-y-6 animate-content pb-10">
            {/* Cabecalho do Calendario */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-sm border border-stone-100 dark:border-zinc-800 transition-all duration-500">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={handlePrev} className="size-8 flex items-center justify-center text-stone-600">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <div className="text-center">
                        <h3 className="font-black text-stone-800 dark:text-zinc-100 text-lg tracking-tighter uppercase leading-none">
                            {viewMode === 'Dia' ? currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) : `${monthNames[month]} ${year}`}
                        </h3>
                        {viewMode === 'Dia' && <p className="text-[10px] font-black text-brand uppercase tracking-widest mt-1">{currentDate.toLocaleDateString('pt-BR', { weekday: 'long' })}</p>}
                    </div>
                    <button onClick={handleNext} className="size-8 flex items-center justify-center text-stone-600">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>

                <div className="flex p-1 bg-stone-50 dark:bg-zinc-800/50 rounded-2xl mb-6">
                    {['Agenda', 'Mês', 'Semana', 'Dia'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => {
                                if (!isPremium && mode === 'Agenda') {
                                    onLockClick();
                                } else {
                                    setViewMode(mode);
                                }
                            }}
                            className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-brand text-white shadow-lg' : 'text-stone-500 hover:text-stone-800'} ${!isPremium && mode === 'Agenda' ? 'opacity-50' : ''}`}
                        >
                            {mode}
                            {!isPremium && mode === 'Agenda' && <span className="material-symbols-outlined text-[8px] ml-1 filled">workspace_premium</span>}
                        </button>
                    ))}
                </div>

                {viewMode === 'Mês' && (
                    <>
                        {/* Grid Dias da Semana */}
                        <div className="grid grid-cols-7 border-b border-stone-100 dark:border-zinc-800 mb-2">
                            {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((d, i) => (
                                <div key={d} className={`py-2 text-[9px] font-black ${i === 6 ? 'text-red-500' : 'text-stone-500'} text-center`}>{d}</div>
                            ))}
                        </div>

                        {/* Grid do Mes */}
                        <div className="grid grid-cols-7 border-l border-t border-stone-50 dark:border-zinc-800/50">
                            {blanks.map(b => <div key={`b-${b}`} className="aspect-square border-r border-b border-stone-50 dark:border-zinc-800/50 bg-stone-50/30 dark:bg-zinc-900/40"></div>)}
                            {days.map(day => {
                                const dayTasks = getTasksForDay(day);
                                const todayMarker = isToday(day);
                                return (
                                    <div key={day} className="aspect-square border-r border-b border-stone-50 dark:border-zinc-800/50 relative p-1 group">
                                        <span className={`text-[10px] font-bold ${todayMarker ? 'bg-brand text-white size-5 flex items-center justify-center rounded-lg rotate-6' : 'text-stone-600 dark:text-zinc-400'}`}>
                                            {day}
                                        </span>
                                        <div className="mt-1 space-y-0.5 overflow-hidden">
                                            {dayTasks.slice(0, 2).map((t, tid) => (
                                                <div key={tid} className={`h-1.5 rounded-full ${CATEGORIES[t.cat]?.color === 'red' ? 'bg-red-500' : 'bg-brand/40'}`}></div>
                                            ))}
                                            {dayTasks.length > 2 && <div className="text-[7px] font-black text-stone-500 text-center">+{dayTasks.length - 2}</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {viewMode === 'Semana' && (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                        {(() => {
                            const monday = new Date(currentDate);
                            const day = monday.getDay();
                            const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
                            monday.setDate(diff);

                            return Array.from({ length: 7 }).map((_, i) => {
                                const d = new Date(monday);
                                d.setDate(monday.getDate() + i);
                                const dStr = d.toISOString().split('T')[0];
                                const dayTasks = tasks.filter(t => t.date === dStr && t.type !== 'note');
                                const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
                                const isDToday = d.toDateString() === new Date().toDateString();

                                return (
                                    <div key={i} className={`p-4 rounded-3xl border border-stone-100 dark:border-zinc-800 ${isDToday ? 'bg-brand-light dark:bg-brand-shadow ring-2 ring-brand/20' : 'bg-stone-50/50 dark:bg-zinc-800/30'}`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isDToday ? 'text-brand' : 'text-stone-400'}`}>{dayNames[i]}</span>
                                                <span className="text-sm font-black text-stone-800 dark:text-zinc-100">{d.getDate()}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-stone-400">{dayTasks.length} {dayTasks.length === 1 ? 'tarefa' : 'tarefas'}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {dayTasks.length === 0 ? (
                                                <p className="text-[10px] text-stone-300 dark:text-zinc-600 font-bold italic">Nenhuma atividade programada</p>
                                            ) : (
                                                dayTasks.map((t, tid) => (
                                                    <div key={tid} className="group relative flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-xl shadow-sm border border-stone-50 dark:border-zinc-800/50 cursor-pointer hover:bg-stone-50 transition-all">
                                                        <div onClick={() => onEditTask(t)} className="flex items-center gap-2 flex-1 min-w-0">
                                                            <div className={`size-1.5 rounded-full ${CATEGORIES[t.cat]?.color === 'red' ? 'bg-red-500' : 'bg-brand'}`}></div>
                                                            <span className={`text-xs font-bold truncate flex-1 ${t.done ? 'line-through opacity-40' : 'text-stone-700 dark:text-zinc-300'}`}>{t.title}</span>
                                                            <span className="text-[8px] font-black opacity-30 uppercase">{t.time}</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onDeleteTask(t.id); }}
                                                            className="size-6 rounded-full flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}

                {viewMode === 'Dia' && (
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 no-scrollbar py-4">
                        {(() => {
                            const dStr = currentDate.toISOString().split('T')[0];
                            const dayTasks = tasks.filter(t => t.date === dStr && t.type !== 'note').sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

                            if (dayTasks.length === 0) return (
                                <div className="py-12 text-center opacity-40">
                                    <p className="text-xs font-black uppercase tracking-widest text-stone-400">Dia livre!<br />Sem tarefas agendadas.</p>
                                </div>
                            );

                            return dayTasks.map((t, tid) => (
                                <div key={tid} className="flex gap-4 group">
                                    <div className="w-12 text-right pt-1">
                                        <span className="text-[10px] font-black text-stone-400 dark:text-zinc-500">{t.time}</span>
                                    </div>
                                    <div className="flex-1 relative pb-6">
                                        {/* Linha vertical decorativa */}
                                        {tid !== dayTasks.length - 1 && <div className="absolute left-[3px] top-6 bottom-0 w-[2px] bg-stone-100 dark:bg-zinc-800"></div>}
                                        <div className="absolute left-0 top-[7px] size-2 rounded-full bg-brand shadow-[0_0_8px_var(--primary-shadow)]"></div>

                                        <div className="ml-6 flex-1 bg-stone-50 dark:bg-zinc-800/40 p-5 rounded-[2rem] border border-stone-100 dark:border-zinc-800 group-hover:scale-[1.02] transition-all duration-300 relative group/card hover:shadow-md">
                                            <div onClick={() => onEditTask(t)} className="flex justify-between items-start mb-1 cursor-pointer">
                                                <h4 className={`text-sm font-black ${t.done ? 'line-through opacity-40' : 'text-stone-800 dark:text-zinc-100'}`}>{t.title}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${CATEGORIES[t.cat]?.color === 'red' ? 'bg-red-50 text-red-500' : 'bg-brand-light text-brand'}`}>
                                                        {t.cat}
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onEditTask(t); }}
                                                        className="size-6 flex items-center justify-center text-stone-400 hover:text-brand transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDeleteTask(t.id); }}
                                                        className="size-6 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                            {t.desc && <p onClick={() => onEditTask(t)} className="text-[10px] text-stone-500 dark:text-zinc-400 font-medium leading-relaxed mt-1 cursor-pointer">{t.desc}</p>}
                                        </div>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}

                {viewMode === 'Agenda' && (
                    <div className="max-h-[540px] overflow-y-auto pr-2 no-scrollbar">
                        {(() => {
                            // Calculate start of current week
                            const monday = new Date(currentDate);
                            const day = monday.getDay(); // 0=Sun, 1=Mon
                            const diff = monday.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
                            monday.setDate(diff);

                            const weekDays = Array.from({ length: 7 }, (_, i) => {
                                const d = new Date(monday);
                                d.setDate(monday.getDate() + i);
                                return d;
                            });

                            return (
                                <div className="flex flex-col gap-4 pb-10">
                                    {weekDays.map((date, i) => {
                                        const dateStr = date.toISOString().split('T')[0];
                                        // Show ONLY notes
                                        const dayNotes = tasks.filter(t => t.date === dateStr && t.type === 'note');
                                        const isDToday = date.toDateString() === new Date().toDateString();
                                        const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

                                        return (
                                            <div
                                                key={dateStr}
                                                className={`p-4 rounded-[2rem] border transition-all ${isDToday ? 'bg-white dark:bg-zinc-900 border-brand/20 shadow-sm' : 'bg-stone-50/50 dark:bg-zinc-800/20 border-transparent hover:border-stone-200 dark:hover:border-zinc-700'}`}
                                            >
                                                {/* Header Row */}
                                                <div className="flex items-center justify-between mb-3 px-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`text-xl font-black ${isDToday ? 'text-brand' : 'text-stone-300 dark:text-zinc-600'}`}>{String(date.getDate()).padStart(2, '0')}</div>
                                                        <div className={`text-[10px] font-bold uppercase tracking-widest ${isDToday ? 'text-stone-800 dark:text-zinc-100' : 'text-stone-400 dark:text-zinc-500'}`}>{dayNames[i]}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => onOpenAdd && onOpenAdd(dateStr, 'note')}
                                                        className="size-8 rounded-full bg-white dark:bg-zinc-800 border border-stone-100 dark:border-zinc-700 flex items-center justify-center text-stone-400 hover:text-brand hover:border-brand transition-all shadow-sm active:scale-90"
                                                    >
                                                        <span className="material-symbols-outlined text-sm font-black">add</span>
                                                    </button>
                                                </div>

                                                {/* Notes List */}
                                                <div className="space-y-2">
                                                    {dayNotes.length === 0 ? (
                                                        <div className="px-2 py-4 border-l-2 border-stone-100 dark:border-zinc-800 border-dashed ml-2">
                                                            <span className="text-[10px] text-stone-300 dark:text-zinc-700 italic font-medium pl-2">Nada anotado...</span>
                                                        </div>
                                                    ) : (
                                                        dayNotes.map(note => (
                                                            <div
                                                                key={note.id}
                                                                onClick={(e) => { e.stopPropagation(); onEditTask && onEditTask(note); }}
                                                                className="relative group bg-[#fffdf5] dark:bg-yellow-900/5 p-4 rounded-2xl border border-yellow-100 dark:border-yellow-900/20 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                                            >
                                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                                    <div className="space-y-1 pr-8">
                                                                        <h5 className="text-sm font-bold text-stone-800 dark:text-zinc-200 leading-tight">{note.title}</h5>
                                                                        {note.desc && (
                                                                            <p
                                                                                className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed font-medium overflow-hidden text-ellipsis break-all"
                                                                                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                                                                            >
                                                                                {note.desc}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex justify-between items-center mt-2 border-t border-yellow-100 dark:border-yellow-900/20 pt-2">
                                                                    <span className="text-[8px] font-black text-yellow-600/40 uppercase tracking-widest bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded-md">Nota</span>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); onDeleteTask(note.id); }}
                                                                        className="p-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors"
                                                                        title="Excluir nota"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[14px] font-black">delete</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
};

// Remote Version & Subscriptions
const APP_VERSION = '1.0.2';
const VERSION_CONTROL_URL = 'https://raw.githubusercontent.com/isthejota/Minha-Bagunca/main/version-control.json';
const PREMIUM_LINK = 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=41e63f17552c4ae8bd3e967608d2097d';

const firebaseConfig = {
    apiKey: "AIzaSyDk9GDK_5ixlYhHXkjOm_1m8fkkvuyQ5qQ",
    authDomain: "minha-bagunca.firebaseapp.com",
    projectId: "minha-bagunca",
    storageBucket: "minha-bagunca.firebasestorage.app",
    messagingSenderId: "881660558108",
    appId: "1:881660558108:android:dfa7583e63757f53bf98d9"
};

// Initialize Firebase (Compat)
if (window.firebase && !window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
}
const db = window.firebase ? window.firebase.firestore() : null;
const auth = window.firebase ? window.firebase.auth() : null;
const googleProvider = window.firebase ? new window.firebase.auth.GoogleAuthProvider() : null;

const PremiumModal = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-stone-100 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
                <div className="h-40 bg-brand flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        {[...Array(20)].map((_, i) => (
                            <span key={i} className="material-symbols-outlined absolute text-4xl" style={{ top: Math.random() * 100 + '%', left: Math.random() * 100 + '%' }}>star</span>
                        ))}
                    </div>
                    <div className="size-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mb-2">
                        <span className="material-symbols-outlined text-5xl text-white filled">workspace_premium</span>
                    </div>
                    <h3 className="text-white text-xl font-black uppercase tracking-tighter italic">Seja Premium</h3>
                </div>

                <div className="p-8 space-y-6 text-center">
                    <p className="text-sm font-bold text-stone-600 dark:text-zinc-400">Desbloqueie todo o potencial da sua criatividade por apenas <span className="text-brand font-black">R$ 9,99/mês</span>.</p>

                    <div className="space-y-3 text-left">
                        {[
                            { icon: 'palette', text: 'Cores e Temas Personalizados' },
                            { icon: 'dark_mode', text: 'Modo Escuro Completo' },
                            { icon: 'calendar_month', text: 'Visualização de Agenda' },
                            { icon: 'target', text: 'Sistema de Metas Inteligentes' },
                            { icon: 'cleaning_services', text: 'Limpeza e Gestão Avançada' }
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="size-6 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                                    <span className="material-symbols-outlined text-sm filled">{feat.icon}</span>
                                </div>
                                <span className="text-xs font-bold text-stone-700 dark:text-zinc-300">{feat.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3 pt-4">
                        <a
                            href={PREMIUM_LINK}
                            target="_system"
                            className="block w-full py-4 bg-brand text-white rounded-2xl font-black text-center shadow-lg shadow-brand/20 active:scale-95 transition-all"
                        >
                            Assinar Agora
                        </a>
                        <button
                            onClick={onClose}
                            className="w-full py-2 text-xs font-black text-stone-400 uppercase tracking-widest hover:text-stone-600 dark:hover:text-zinc-200 transition-colors"
                        >
                            Talvez mais tarde
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const App = () => {

    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Authentication Listener
    useEffect(() => {
        if (!auth) {
            setAuthLoading(false);
            return;
        }
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleGoogleLogin = async () => {
        if (!auth) {
            showAppAlert("Erro", "Firebase Auth não inicializado.");
            return;
        }

        // 1. Try Native Cordova Login first
        if (typeof window !== 'undefined' && window.plugins && window.plugins.googleplus) {
            console.log("Iniciando Login Nativo (Google Plus Plugin)...");
            window.plugins.googleplus.login(
                {
                    'webClientId': '881660558108-nv7ue2a5r4rmrmqm16uq4ovan1sqemcu.apps.googleusercontent.com',
                    'offline': false
                },
                async (obj) => {
                    console.log("Native OAuth Success, syncing with Firebase...", obj);
                    try {
                        // Create Firebase credential from native result
                        const credential = window.firebase.auth.GoogleAuthProvider.credential(obj.idToken);
                        await auth.signInWithCredential(credential);
                    } catch (err) {
                        console.error("Firebase sync error:", err);
                        showAppAlert("Erro", "Erro ao sincronizar com Firebase: " + err.message);
                    }
                },
                (msg) => {
                    console.warn("Native Login cancel/error:", msg);
                    // If it was just a manual cancel, don't necessarily error out, 
                    // or try fallback if it makes sense. Not usually.
                    if (msg !== 'cancel') showAppAlert("Erro", "Erro no Login Nativo: " + msg);
                }
            );
            return;
        }

        // 2. Fallback to Web/Firebase Popup (for Browser testing or if plugin missing)
        try {
            if (!googleProvider) throw new Error("Google Provider not ready");
            console.log("Iniciando signInWithPopup (Web Fallback)...");
            await auth.signInWithPopup(googleProvider);
        } catch (e) {
            console.error("Erro detalhado de Login Google (Web):", e);
            let msg = e.message;
            if (e.code === 'auth/internal-error') {
                msg = "Erro Interno. Verifique o console. No Android, certifique-se que o plugin está instalado.";
            }
            showAppAlert("Erro", "Erro ao entrar (" + (e.code || 'erro') + "): " + msg);
        }
    };

    const handleEmailLogin = async (email, password) => {
        if (!auth) return;
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (e) {
            console.error("Login error:", e);
            if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
                showAppAlert("Acesso Negado", "E-mail ou senha incorretos. Se ainda não tem uma conta, por favor, realize o seu cadastro primeiro.");
            } else {
                showAppAlert("Erro", "Erro ao entrar: " + e.message);
            }
        }
    };

    const handleEmailRegister = async (name, email, password) => {
        if (!auth) return;
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            if (userCredential.user) {
                await userCredential.user.updateProfile({ displayName: name });
                setProfile({ name, photo: 'https://picsum.photos/seed/artist/200' });
            }
        } catch (e) {
            console.error("Registration error:", e);
            let msg = e.message;
            if (e.code === 'auth/email-already-in-use') {
                msg = "Este e-mail já está sendo usado por outra conta.";
            } else if (e.code === 'auth/invalid-email') {
                msg = "O endereço de e-mail não é válido.";
            } else if (e.code === 'auth/weak-password') {
                msg = "A senha é muito fraca. Por favor, use uma senha mais forte.";
            }
            showAppAlert("Erro ao cadastrar", msg);
        }
    };

    const handleLogout = async () => {
        if (auth) {
            await auth.signOut();
            setUser(null);
            // Reset state to defaults on logout
            setTasks([]);
            setGoals([]);
            setProfile({ name: 'Mente Criativa', photo: 'https://picsum.photos/seed/artist/200' });
            setDarkMode(false);
            setThemeColor('#ee9d2b');
            setRemindersEnabled(true);
            setAlarmSound(null);
            // Clear local cache
            localStorage.removeItem('minha-bagunca-profile');
            localStorage.removeItem('minha-bagunca-reminders');
            localStorage.removeItem('minha-bagunca-alarm-sound');
            localStorage.removeItem('minha-bagunca-darkmode');
            localStorage.removeItem('minha-bagunca-themecolor');
        }
    };


    const [view, setView] = useState('daily');
    const [showAdd, setShowAdd] = useState(false);
    const [showAddGoal, setShowAddGoal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', desc: '', time: '09:00', cat: 'Trabalho', date: new Date().toISOString().split('T')[0], type: 'task', alarm: 'Padrão' });
    const [newGoal, setNewGoal] = useState({
        title: '',
        progress: 0,
        days: [],
        hours: ['08:00'],
        frequency: 1
    });
    const [updateRequired, setUpdateRequired] = useState(false);
    const [updateInfo, setUpdateInfo] = useState(null);

    // --- Account-bound States (Synced with Firestore) ---
    const isCloudLoadedRef = useRef(false);
    const [isPremium, setIsPremium] = useState(() => {
        return localStorage.getItem('minha-bagunca-premium') === 'true';
    });
    const [showPremiumAd, setShowPremiumAd] = useState(false);

    // profile: name + photo (data URL or remote URL from Google)
    const [profile, setProfile] = useState(() => {
        const saved = localStorage.getItem('minha-bagunca-profile');
        try { return saved ? JSON.parse(saved) : { name: 'Mente Criativa', photo: 'https://picsum.photos/seed/artist/200' }; } catch (e) { return { name: 'Mente Criativa', photo: 'https://picsum.photos/seed/artist/200' }; }
    });

    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('minha-bagunca-darkmode');
        return saved ? JSON.parse(saved) : false;
    });

    const [themeColor, setThemeColor] = useState(() => {
        const saved = localStorage.getItem('minha-bagunca-themecolor');
        return saved || '#ee9d2b';
    });

    const [remindersEnabled, setRemindersEnabled] = useState(() => {
        const s = localStorage.getItem('minha-bagunca-reminders');
        return s ? JSON.parse(s) : true;
    });

    const [alarmSound, setAlarmSound] = useState(() => {
        const saved = localStorage.getItem('minha-bagunca-alarm-sound');
        try { return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
    });

    const reminderTimeoutsRef = useRef([]);

    // --- Cloud Sync State ---
    const [tasks, setTasks] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // --- Cloud Synchronization and Listeners ---
    useEffect(() => {
        if (!user || !db) {
            isCloudLoadedRef.current = false;
            return;
        }
        setLoadingData(true);

        // 1. Sync Tasks (Real-time)
        const tasksRef = db.collection('users').doc(user.uid).collection('tasks');
        const unsubTasks = tasksRef.onSnapshot((snapshot) => {
            const cloudTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setTasks(cloudTasks);
            setLoadingData(false);
        }, (error) => {
            console.error("Error syncing tasks:", error);
            setLoadingData(false);
        });

        // 2. Sync Goals (Real-time)
        const goalsRef = db.collection('users').doc(user.uid).collection('goals');
        const unsubGoals = goalsRef.onSnapshot((snapshot) => {
            const cloudGoals = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setGoals(cloudGoals);
        }, (error) => {
            console.error("Error syncing goals:", error);
        });

        // 3. Sync Settings and Preferences
        const settingsRef = db.collection('users').doc(user.uid).collection('settings').doc('preferences');
        const unsubSettings = settingsRef.onSnapshot((docSnap) => {
            if (docSnap.exists) {
                const data = docSnap.data();
                // Prioritize cloud data, but only update state if it's actually different to avoid cycles
                if (data.profile) setProfile(prev => JSON.stringify(prev) === JSON.stringify(data.profile) ? prev : data.profile);
                if (data.darkMode !== undefined) setDarkMode(data.darkMode);
                if (data.themeColor) setThemeColor(data.themeColor);
                if (data.remindersEnabled !== undefined) setRemindersEnabled(data.remindersEnabled);
                if (data.alarmSound !== undefined) setAlarmSound(prev => JSON.stringify(prev) === JSON.stringify(data.alarmSound) ? prev : data.alarmSound);
                if (data.isPremium !== undefined) setIsPremium(data.isPremium);

                // Show promotion if not premium on entry
                if (!data.isPremium) {
                    setShowPremiumAd(true);
                }
            } else {
                // Initialize default profile for new users based on Auth info (Google/Email)
                settingsRef.set({
                    profile: {
                        name: user.displayName || 'Mente Criativa',
                        photo: user.photoURL || 'https://picsum.photos/seed/artist/200'
                    },
                    darkMode: false,
                    themeColor: '#ee9d2b',
                    remindersEnabled: true,
                    alarmSound: null,
                    isPremium: false
                }, { merge: true });
            }
            isCloudLoadedRef.current = true; // Mark as loaded so auto-save can begin
        });

        return () => {
            unsubTasks();
            unsubGoals();
            unsubSettings();
        };
    }, [user]);

    // Save functions now write to Firestore
    // We wrap these to replace the old local state setters where appropriate, 
    // or we just rely on the onSnapshot to update the UI.

    // Consolidated Cloud Save & Local Cache
    useEffect(() => {
        if (!user || !db || !isCloudLoadedRef.current) return;

        const settingsRef = db.collection('users').doc(user.uid).collection('settings').doc('preferences');
        settingsRef.set({
            profile,
            darkMode,
            themeColor,
            remindersEnabled,
            alarmSound,
            isPremium
        }, { merge: true }).catch(e => console.error("Error saving preferences:", e));

        // Update local cache for better responsiveness on next load
        localStorage.setItem('minha-bagunca-profile', JSON.stringify(profile));
        localStorage.setItem('minha-bagunca-darkmode', JSON.stringify(darkMode));
        localStorage.setItem('minha-bagunca-themecolor', themeColor);
        localStorage.setItem('minha-bagunca-reminders', JSON.stringify(remindersEnabled));
        if (alarmSound) localStorage.setItem('minha-bagunca-alarm-sound', JSON.stringify(alarmSound));
        else localStorage.removeItem('minha-bagunca-alarm-sound');
        localStorage.setItem('minha-bagunca-premium', isPremium.toString());
    }, [user, profile, darkMode, themeColor, remindersEnabled, alarmSound, isPremium]);

    // Apply Theme (Visual only)
    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    // document modal for Policies/Terms
    const [docModal, setDocModal] = useState({ show: false, title: '', content: '' });
    useEffect(() => {
        const r = parseInt(themeColor.slice(1, 3), 16);
        const g = parseInt(themeColor.slice(3, 5), 16);
        const b = parseInt(themeColor.slice(5, 7), 16);

        const adjust = (c, amt) => Math.max(0, Math.min(255, c + amt));
        const lR = adjust(r, 20), lG = adjust(g, 20), lB = adjust(b, 20);

        const tintR = adjust(r, 240), tintG = adjust(g, 240), tintB = adjust(b, 240);
        const paperBg = darkMode ? '#09090b' : `rgb(${tintR}, ${tintG}, ${tintB})`;
        const gridOp = darkMode ? 0.04 : 0.08;
        const gridColor = `rgba(${r}, ${g}, ${b}, ${gridOp})`;

        document.documentElement.style.setProperty('--primary', themeColor);
        document.documentElement.style.setProperty('--primary-light', `rgba(${r}, ${g}, ${b}, 0.05)`);
        document.documentElement.style.setProperty('--primary-shadow', `rgba(${r}, ${g}, ${b}, 0.15)`);
        document.documentElement.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${themeColor}, rgb(${lR}, ${lG}, ${lB}))`);
        document.documentElement.style.setProperty('--bg-paper', paperBg);
        document.documentElement.style.setProperty('--grid-color', gridColor);
        document.documentElement.style.setProperty('--border-weak', `rgba(${r}, ${g}, ${b}, 0.1)`);
    }, [themeColor, darkMode]);

    // Version Check
    const compareVersions = (v1, v2) => {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if (parts1[i] > parts2[i]) return 1;
            if (parts1[i] < parts2[i]) return -1;
        }
        return 0;
    };

    const checkAppVersion = async () => {
        try {
            const response = await fetch(VERSION_CONTROL_URL, { cache: 'no-cache' });
            if (!response.ok) return; // Fail silently if can't reach server
            const data = await response.json();

            // Check if current version is below minimum required
            if (compareVersions(APP_VERSION, data.minVersion) < 0) {
                setUpdateInfo(data);
                setUpdateRequired(true);
            }
        } catch (e) {
            console.warn('Could not check app version:', e);
            // Fail silently - don't block app if version check fails
        }
    };

    useEffect(() => {
        checkAppVersion();
    }, []);
    const openDoc = (title, content) => setDocModal({ show: true, title, content });

    // CRUD for Tasks (Firestore)
    const deleteFutureTasks = async () => {
        if (!isPremium) {
            setShowPremiumAd(true);
            return;
        }
        if (!user || !db) return;
        const todayStr = new Date().toISOString().split('T')[0];
        try {
            const snap = await db.collection('users').doc(user.uid).collection('tasks')
                .where('date', '>', todayStr)
                .get();

            if (snap.empty) {
                showAppAlert("Info", "Nenhum lembrete futuro encontrado.");
                return;
            }

            showAppConfirm(
                "Confirmar Exclusão",
                `Deseja apagar ${snap.size} lembretes futuros?\n\nIsso apagará todas as tarefas agendadas para datas após hoje.`,
                async () => {
                    const batch = db.batch();
                    snap.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                    showAppAlert("Sucesso", `${snap.size} lembretes futuros apagados.`);
                }
            );
        } catch (e) {
            console.error("Error deleting future tasks:", e);
            showAppAlert("Erro", "Erro ao apagar lembretes futuros.");
        }
    };

    const deleteTask = (id) => {
        if (!user || !db) return;
        showAppConfirm(
            "Excluir Lembrete",
            "Deseja realmente apagar este lembrete? Esta ação não pode ser desfeita.",
            async () => {
                try {
                    await db.collection('users').doc(user.uid).collection('tasks').doc(id).delete();
                } catch (e) {
                    console.error("Error deleting task:", e);
                    showAppAlert("Erro", "Não foi possível excluir o lembrete.");
                }
            }
        );
    };

    const handleAddTask = async () => {
        if (!newTask.title) return;
        if (!user || !db) return;

        try {
            if (newTask.id) {
                // Edit existing
                // newTask.id is the Doc ID
                const { id, ...data } = newTask; // separate id
                await db.collection('users').doc(user.uid).collection('tasks').doc(id).set(data, { merge: true });
            } else {
                // Add new
                // Use a random ID or let firestore gen it. simpler to generate ourselves for optimistic UI if needed, 
                // but here we wait for sync.
                const newDocRef = db.collection('users').doc(user.uid).collection('tasks').doc();
                await newDocRef.set({
                    ...newTask,
                    done: false,
                    createdAt: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error("Error saving task:", e);
            showAppAlert("Erro", "Erro ao salvar meta: " + e.message);
        }

        setShowAdd(false);
        setNewTask({ title: '', desc: '', time: '09:00', cat: 'Trabalho', date: new Date().toISOString().split('T')[0], type: 'task', alarm: 'Padrão' });
    };

    const toggleTask = async (id) => {
        const task = tasks.find(t => t.id === id);
        if (task && user && db) {
            const newDone = !task.done;
            try {
                await db.collection('users').doc(user.uid).collection('tasks').doc(id).update({ done: newDone });
                if (task.goalId) {
                    recalculateGoalProgress(task.goalId);
                }
            } catch (e) {
                console.error("Error toggling task:", e);
            }
        }
    };

    const recalculateGoalProgress = async (goalId) => {
        if (!user || !db) return;
        try {
            const tasksSnap = await db.collection('users').doc(user.uid).collection('tasks')
                .where('goalId', '==', goalId)
                .get();

            const goalTasks = tasksSnap.docs.map(doc => doc.data());
            const total = goalTasks.length;
            if (total === 0) return;

            const completed = goalTasks.filter(t => t.done).length;
            const progress = Math.round((completed / total) * 100);

            await db.collection('users').doc(user.uid).collection('goals').doc(goalId).update({
                progress: progress
            });
        } catch (e) {
            console.error("Error recalculating goal progress:", e);
        }
    };

    // --- Restored Missing Functions ---

    const handleProfileFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePickAlarmSound = async () => {
        if (typeof window !== 'undefined' && window.chooser) {
            try {
                const file = await window.chooser.getFile("audio/*");
                if (file) {
                    setAlarmSound({
                        uri: file.dataURI,
                        name: file.name,
                        channelId: 'alarm_channel_' + Date.now() // unique channel for this sound
                    });
                }
            } catch (e) {
                console.warn("Chooser error:", e);
            }
        } else {
            // Fallback for browser testing
            showAppAlert("Simulação", "No browser, simulando escolha de som.");
            setAlarmSound({ uri: '', name: 'Som Simulado (Browser)', channelId: 'default' });
        }
    };

    const testAlarmSound = () => {
        if (alarmSound && alarmSound.uri) {
            // Try Cordova Media
            if (typeof Media !== 'undefined') {
                const m = new Media(alarmSound.uri, () => m.release(), (err) => console.error(err));
                m.play();
                setTimeout(() => { m.stop(); m.release(); }, 5000);
            } else {
                // Browser fallback
                const audio = new Audio(alarmSound.uri);
                audio.play().catch(e => console.log('Audio play error', e));
            }
        } else {
            showAppAlert("Aviso", "Nenhum som personalizado definido.");
        }
    };

    const handleOpenAdd = (dateStr = null, type = 'task') => {
        if (!isPremium && type === 'note' && view === 'calendar') {
            setShowPremiumAd(true);
            return;
        }
        setNewTask({
            title: '',
            desc: '',
            time: '09:00',
            cat: 'Trabalho',
            date: dateStr || new Date().toISOString().split('T')[0],
            type: type,
            alarm: 'Padrão'
        });
        setShowAdd(true);
    };

    const handleEditTask = (task) => {
        setNewTask({ alarm: 'Padrão', ...task }); // clone and ensure alarm field exists
        setShowAdd(true);
    };

    const deleteGoal = (id) => {
        if (!user || !db) return;
        showAppConfirm(
            "Excluir Meta",
            "Deseja apagar esta meta e todos os lembretes associados a ela?",
            async () => {
                try {
                    // 1. Delete associated tasks
                    const tasksSnap = await db.collection('users').doc(user.uid).collection('tasks')
                        .where('goalId', '==', id)
                        .get();

                    const batch = db.batch();
                    tasksSnap.forEach(doc => batch.delete(doc.ref));

                    // 2. Delete the goal
                    batch.delete(db.collection('users').doc(user.uid).collection('goals').doc(id));

                    await batch.commit();
                } catch (e) {
                    console.error("Error deleting goal:", e);
                    showAppAlert("Erro", "Não foi possível excluir a meta.");
                }
            }
        );
    };

    const handleAddGoal = async () => {
        if (!isPremium) {
            setShowPremiumAd(true);
            return;
        }
        if (!newGoal.title || !user || !db) return;
        try {
            // 1. Create the Goal
            const goalRef = db.collection('users').doc(user.uid).collection('goals').doc();
            const goalId = goalRef.id;

            await goalRef.set({
                ...newGoal,
                createdAt: new Date().toISOString()
            });

            // 2. Generate Tasks for the next 30 days based on schedule
            const batch = db.batch();
            const now = new Date();
            for (let i = 0; i < 30; i++) {
                const day = new Date(now);
                day.setDate(now.getDate() + i);
                const weekDay = day.getDay(); // 0-6

                // If this day is in the selected days
                if (newGoal.days.includes(weekDay)) {
                    const dateStr = day.toISOString().split('T')[0];
                    newGoal.hours.forEach(hour => {
                        const taskRef = db.collection('users').doc(user.uid).collection('tasks').doc();
                        batch.set(taskRef, {
                            title: newGoal.title,
                            desc: `Meta: ${newGoal.title}`,
                            time: hour,
                            date: dateStr,
                            cat: 'Urgente', // High visibility for goals
                            done: false,
                            type: 'task',
                            goalId: goalId,
                            alarm: 'Padrão'
                        });
                    });
                }
            }
            await batch.commit();

            setShowAddGoal(false);
            setNewGoal({ title: '', progress: 0, days: [], hours: ['08:00'], frequency: 1 });
        } catch (e) {
            console.error("Error adding goal:", e);
            showAppAlert("Erro", "Erro ao salvar meta: " + e.message);
        }
    };

    // helper to show notification (uses Web Notifications API when available)
    const [alertModal, setAlertModal] = useState({ show: false, title: '', body: '', isConfirm: false, onConfirm: null, onCancel: null });

    const showAppAlert = (title, body) => {
        setAlertModal({ show: true, title, body, isConfirm: false, onConfirm: null, onCancel: null });
    };

    const showAppConfirm = (title, body, onConfirm, onCancel) => {
        setAlertModal({
            show: true,
            title,
            body,
            isConfirm: true,
            onConfirm: () => { setAlertModal(prev => ({ ...prev, show: false })); onConfirm?.(); },
            onCancel: () => { setAlertModal(prev => ({ ...prev, show: false })); onCancel?.(); }
        });
    };

    const showNotification = (task) => {
        const title = task.title || 'Lembrete';
        const body = task.desc ? `${task.desc} — ${task.time}` : `Hora: ${task.time}`;
        console.log('showNotification called:', { title, body });

        // NOTE: Sound will play when notification triggers (see 'trigger' event listener)
        // Do NOT play sound here to avoid duplicate playback

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
                    smallIcon: 'res://icon',
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

        // if (!remindersEnabled) return; // Removed to allow individual overrides

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
                    if (task.done || !task.time || task.type === 'note') return;

                    // Logic: schedule if global is ON OR task is "Sim" override
                    if (!remindersEnabled && task.alarm !== 'Sim') return;

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
                        // Sound is handled manually in 'trigger' listener for finer control
                        sound: alarmSound?.uri || undefined,
                        smallIcon: 'res://icon',
                        data: { taskId: task.id, alarm: task.alarm || 'Padrão' }
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
            if (!task.time || task.type === 'note') return; // skip notes and no-time tasks

            // Logic: schedule if global is ON OR task is "Sim" override
            if (!remindersEnabled && task.alarm !== 'Sim') return;

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

                        // Check alarm override
                        const alarmPref = notification.data?.alarm || 'Padrão';
                        let shouldPlay = false;
                        if (alarmPref === 'Sim') shouldPlay = true;
                        else if (alarmPref === 'Não') shouldPlay = false;
                        else shouldPlay = remindersEnabled; // Follow global setting

                        // Play alarm sound for 5 seconds when notification arrives
                        if (shouldPlay && alarmSound && alarmSound.uri) {
                            if (typeof Media !== 'undefined') {
                                const m = new Media(alarmSound.uri, () => m.release(), (err) => console.error('Media error:', err));
                                m.play();
                                // Stop after 5 seconds
                                setTimeout(() => {
                                    try {
                                        m.stop();
                                        m.release();
                                    } catch (e) {
                                        console.warn('Error stopping media:', e);
                                    }
                                }, 5000);
                            }
                        }
                    });
                }



            } else {
                onReady();
            }
        };
        init();
    }, [tasks, remindersEnabled, alarmSound]);


    if (authLoading) return <LoadingScreen />;

    return (
        <>
            {!user ? (
                <Login onGoogleLogin={handleGoogleLogin} onEmailLogin={handleEmailLogin} onEmailRegister={handleEmailRegister} />
            ) : (
                <div className="app-root w-full min-h-screen flex flex-col paper-bg shadow-2xl relative transition-colors duration-500" style={{ backgroundColor: 'var(--bg-paper)' }}>

                    <header className="flex items-center justify-between px-6 pt-10 pb-6 sticky top-0 backdrop-blur-2xl z-40 transition-all duration-500" style={{ backgroundColor: 'var(--bg-paper)', opacity: 0.96 }}>
                        <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'var(--primary-gradient)' }}></div>
                        <button
                            onClick={() => setView('dashboard')}
                            className={`size-11 flex items-center justify-center rounded-2xl transition-all shadow-sm border ${view === 'dashboard' ? 'bg-brand dark:bg-zinc-100 border-brand dark:border-zinc-100 text-white dark:text-zinc-900 rotate-6' : 'bg-white dark:bg-zinc-900 border-stone-100 dark:border-zinc-800 text-stone-400 dark:text-zinc-500'}`}
                        >
                            <span className="material-symbols-outlined">grid_view</span>
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-black text-stone-800 dark:text-zinc-100 tracking-tighter uppercase italic">Minha Bagunça</span>
                            <div className="h-1.5 w-10 bg-brand rounded-full mt-1 -rotate-2"></div>
                        </div>
                        <button
                            onClick={() => setView('settings')}
                            className={`size-11 rounded-2xl overflow-hidden border-2 transition-all ${view === 'settings' ? 'border-brand scale-110 -rotate-6' : 'border-white dark:border-zinc-800'}`}
                        >
                            <img src={profile.photo} className="size-full object-cover" alt="Perfil" />
                        </button>
                    </header>

                    <main className="flex-1 px-6 pt-6 pb-32 overflow-y-auto no-scrollbar">
                        {view === 'dashboard' && <Dashboard tasks={tasks} goals={goals} onAddGoal={() => { if (!isPremium) { showAppAlert("Plano Premium", "O sistema de Metas é exclusivo para assinantes Premium ✨"); setShowPremiumAd(true); } else setShowAddGoal(true); }} onDeleteGoal={deleteGoal} darkMode={darkMode} />}
                        {view === 'daily' && <DailyList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} onEdit={handleEditTask} darkMode={darkMode} />}
                        {view === 'calendar' && (
                            <CalendarView
                                tasks={tasks}
                                goals={goals}
                                onDeleteGoal={deleteGoal}
                                onAddClick={() => handleOpenAdd()}
                                onToggleTask={toggleTask}
                                onDeleteTask={deleteTask}
                                darkMode={darkMode}
                                onOpenAdd={handleOpenAdd}
                                onEditTask={handleEditTask}
                                isPremium={isPremium}
                                onLockClick={() => {
                                    showAppAlert("Recurso Premium", "A visualização de Agenda é exclusiva para assinantes.");
                                    setShowPremiumAd(true);
                                }}
                            />
                        )}
                        {view === 'settings' && (
                            <div className="space-y-6 animate-content">
                                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-stone-100 dark:border-zinc-800 flex flex-col items-center gap-4 text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isPremium ? 'bg-brand text-white' : 'bg-stone-100 text-stone-400'}`}>
                                            {isPremium ? 'Premium' : 'Gratuito'}
                                        </div>
                                    </div>
                                    <div className="size-24 rounded-[2rem] overflow-hidden rotate-6 shadow-xl border-4 border-white dark:border-zinc-800">
                                        <img src={profile.photo} className="size-full object-cover" alt="avatar" />
                                    </div>
                                    <div className="w-full">
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full text-2xl font-black bg-white dark:bg-zinc-800 rounded-[2rem] border-none shadow-sm p-4 text-center dark:text-zinc-100"
                                        />
                                        <div className="mt-2 flex flex-col items-center">
                                            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest leading-none">Minha Bagunça</p>
                                            <p className="text-[9px] text-stone-300 dark:text-zinc-600 font-bold mt-1 truncate max-w-[200px]">{user.email}</p>
                                        </div>
                                        <div className="mt-4 flex gap-3 justify-center">
                                            <input id="profile-file" type="file" accept="image/*" onChange={handleProfileFile} style={{ display: 'none' }} />
                                            <button onClick={() => document.getElementById('profile-file').click()} className="py-2 px-4 bg-stone-100 dark:bg-zinc-800 rounded-full text-xs font-bold dark:text-zinc-300">Mudar foto</button>
                                            <button onClick={handleLogout} className="py-2 px-4 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-full text-xs font-bold">Sair</button>
                                        </div>
                                    </div>
                                </div>
                                {!isPremium && (
                                    <div className="bg-brand p-6 rounded-[3rem] text-white flex items-center justify-between shadow-lg shadow-brand/20 active:scale-[0.98] transition-all cursor-pointer" onClick={() => setShowPremiumAd(true)}>
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-3xl filled">workspace_premium</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black uppercase tracking-tighter italic">Liberar Premium</span>
                                                <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest leading-none">Apenas R$ 9,99/mês</span>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-3xl">chevron_right</span>
                                    </div>
                                )}
                                <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-stone-100 dark:border-zinc-800 overflow-hidden divide-y divide-stone-50 dark:divide-zinc-800">
                                    <div className="p-6 flex flex-col gap-4 hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-2xl bg-brand-light dark:bg-brand-shadow text-brand flex items-center justify-center">
                                                    <span className="material-symbols-outlined filled">notifications</span>
                                                </div>
                                                <span className="text-sm font-black text-stone-700 dark:text-zinc-300">Lembretes</span>
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
                                                <p className="text-[9px] font-black text-stone-300 dark:text-zinc-600 uppercase tracking-widest mb-1">Arquivo Selecionado</p>
                                                <p className="text-xs font-black text-stone-600 dark:text-zinc-400 truncate max-w-[140px]">
                                                    {alarmSound ? alarmSound.name : 'Padrão do sistema'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={handlePickAlarmSound} className="py-2.5 px-4 bg-stone-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-tight text-stone-600 dark:text-zinc-400 active:scale-95 transition-all">Escolher</button>
                                                {alarmSound && <button onClick={testAlarmSound} className="py-2.5 px-4 bg-brand-light dark:bg-brand-shadow rounded-2xl text-[10px] font-black uppercase tracking-tight text-brand active:scale-95 transition-all">Ouvir</button>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 flex flex-col gap-4 hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-2xl bg-stone-50 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 flex items-center justify-center">
                                                <span className="material-symbols-outlined filled">palette</span>
                                            </div>
                                            <span className="text-sm font-black text-stone-700 dark:text-zinc-300">Cor do App</span>
                                        </div>
                                        <div className="flex gap-4 pl-14 overflow-x-auto py-1 hide-scrollbar">
                                            {[
                                                { name: 'Laranja', color: '#ee9d2b' },
                                                { name: 'Azul', color: '#3b82f6' },
                                                { name: 'Roxo', color: '#8b5cf6' },
                                                { name: 'Verde', color: '#10b981' },
                                                { name: 'Rosa', color: '#f43f5e' }
                                            ].map(c => (
                                                <button
                                                    key={c.color}
                                                    onClick={() => {
                                                        if (!isPremium) {
                                                            showAppAlert("Estilo Premium", "A personalização de cores está disponível apenas na versão Premium 🎨");
                                                            setShowPremiumAd(true);
                                                        } else {
                                                            setThemeColor(c.color);
                                                        }
                                                    }}
                                                    className={`size-10 rounded-full flex-shrink-0 transition-all ${themeColor === c.color ? 'scale-125 ring-4 ring-white dark:ring-zinc-800 shadow-xl' : 'scale-90 hover:scale-110 shadow-sm'} ${!isPremium && 'opacity-50 grayscale-[0.5]'}`}
                                                    style={{ backgroundColor: c.color }}
                                                    aria-label={c.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-6 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-2xl bg-stone-50 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 flex items-center justify-center">
                                                <span className="material-symbols-outlined filled">dark_mode</span>
                                            </div>
                                            <span className="text-sm font-black text-stone-700 dark:text-zinc-300">Modo Noturno Premium</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-3" onClick={() => {
                                                if (!isPremium) {
                                                    showAppAlert("Visão Noturna", "O Modo Escuro é um recurso exclusivo para membros Premium 🌙");
                                                    setShowPremiumAd(true);
                                                }
                                            }}>
                                                <label className={`switch small ${!isPremium ? 'opacity-50 pointer-events-none' : ''}`}>
                                                    <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} disabled={!isPremium} />
                                                    <span className="slider"></span>
                                                </label>
                                                <span className="switch-label dark:text-zinc-400">{darkMode ? 'Ativado' : 'Desativado'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-2xl bg-stone-50 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 flex items-center justify-center">
                                                <span className="material-symbols-outlined filled">info</span>
                                            </div>
                                            <span className="text-sm font-black text-stone-700 dark:text-zinc-300">Versão do App</span>
                                        </div>
                                        <div className="text-sm text-stone-400 dark:text-zinc-500 font-bold">{APP_VERSION}</div>
                                    </div>
                                    <div className="p-6 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => openDoc('Política de Privacidade', PRIVACY_POLICY)}>
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-2xl bg-stone-50 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 flex items-center justify-center">
                                                <span className="material-symbols-outlined filled">policy</span>
                                            </div>
                                            <span className="text-sm font-black text-stone-700 dark:text-zinc-300">Política de Privacidade</span>
                                        </div>
                                        <div className="text-sm text-stone-400 dark:text-zinc-500">Abrir</div>
                                    </div>

                                    <div className="p-6 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer" onClick={() => openDoc('Termos de Uso', TERMS_OF_USE)}>
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-2xl bg-stone-50 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 flex items-center justify-center">
                                                <span className="material-symbols-outlined filled">description</span>
                                            </div>
                                            <span className="text-sm font-black text-stone-700 dark:text-zinc-300">Termos de Uso</span>
                                        </div>
                                        <div className="text-sm text-stone-400 dark:text-zinc-500">Abrir</div>
                                    </div>
                                    <div className="p-6 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer" onClick={() => {
                                        if (!isPremium) {
                                            showAppAlert("Organização Avançada", "A limpeza global de lembretes é uma ferramenta exclusiva Premium 🧹");
                                            setShowPremiumAd(true);
                                        } else {
                                            deleteFutureTasks();
                                        }
                                    }}>
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center">
                                                <span className="material-symbols-outlined filled">delete_sweep</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-red-600 dark:text-red-400">Limpar Lembretes Futuros</span>
                                                <span className="text-[10px] font-bold text-red-400 dark:text-red-500/60 uppercase">Apaga todas as tarefas após hoje</span>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-red-300">chevron_right</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

                    {/* Floating Action Button */}
                    <button
                        onClick={() => handleOpenAdd(new Date().toISOString().split('T')[0])}
                        className="fixed bottom-28 right-6 size-16 bg-brand text-white rounded-[2rem] shadow-2xl shadow-brand/40 flex items-center justify-center active:scale-90 transition-all z-50 group hover:rotate-90"
                        style={{ transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                    >
                        <span className="material-symbols-outlined text-3xl font-black">add</span>
                    </button>

                    <nav className="fixed bottom-0 left-0 right-0 w-full h-24 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border-t border-stone-50 dark:border-zinc-800 shadow-[0_-20px_50px_rgba(0,0,0,0.04)] z-40 px-6 md:px-10 flex items-center justify-around transition-colors duration-500">
                        {[
                            { id: 'dashboard', icon: 'grid_view' },
                            { id: 'daily', icon: 'checklist' },
                            { id: 'calendar', icon: 'calendar_month' },
                            { id: 'settings', icon: 'settings' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setView(item.id)}
                                className={`size-14 rounded-[2rem] flex items-center justify-center transition-all duration-300 ${view === item.id ? 'bg-brand text-white shadow-xl shadow-brand/30 scale-110 -translate-y-2' : 'text-stone-300 dark:text-zinc-600 hover:bg-stone-50 dark:hover:bg-zinc-800'}`}
                            >
                                <span className="material-symbols-outlined text-2xl font-black">{item.icon}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Add Task Modal */}
                    {showAdd && (
                        <div className="fixed inset-0 bg-stone-200/40 dark:bg-black/80 backdrop-blur-sm z-[100] flex flex-col justify-end" onClick={() => setShowAdd(false)}>
                            <div className={`modal-card rounded-t-[4rem] p-10 animate-content shadow-2xl ${newTask.type === 'note' ? 'bg-[#fffdf5] dark:bg-zinc-900 border-t-4 border-yellow-200 dark:border-yellow-900/20' : 'bg-white dark:bg-zinc-900'}`} onClick={e => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-3xl font-black text-stone-800 dark:text-zinc-100 tracking-tighter">{newTask.id ? (newTask.type === 'note' ? 'Editar Nota' : 'Editar Tarefa') : 'Nova Bagunça'}</h3>
                                    <button onClick={() => setShowAdd(false)} className="size-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 active:scale-90 transition-all border-none">
                                        <span className="material-symbols-outlined font-black">close</span>
                                    </button>
                                </div>
                                <div className="space-y-8 no-scrollbar overflow-y-auto max-h-[70vh] pr-2">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">
                                                {newTask.type === 'note' ? 'Título da Nota' : 'O que vamos bagunçar?'}
                                            </p>
                                            <input
                                                type="text"
                                                placeholder={newTask.type === 'note' ? "Ex: Ideia Brilhante" : "Ex: Pintar o mundo"}
                                                value={newTask.title}
                                                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                                className="w-full text-2xl font-black bg-white dark:bg-zinc-800 rounded-[2rem] border-none shadow-sm focus:ring-4 focus:ring-brand-light dark:focus:ring-brand-light/20 p-6 placeholder:text-stone-300 dark:placeholder:text-zinc-600 dark:text-zinc-100"
                                                autoFocus
                                            />
                                        </div>

                                        {newTask.type === 'note' && (
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Descrição</p>
                                                <textarea
                                                    placeholder="Escreva sua nota aqui..."
                                                    value={newTask.desc || ''}
                                                    onChange={e => setNewTask({ ...newTask, desc: e.target.value })}
                                                    className="w-full h-64 text-base font-medium bg-transparent border-none focus:ring-0 p-0 placeholder:text-stone-300 dark:placeholder:text-zinc-600 dark:text-zinc-100 resize-none leading-relaxed"
                                                ></textarea>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setNewTask({ ...newTask, type: 'task' })}
                                                className={`flex-1 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${newTask.type === 'task' ? 'bg-brand text-white shadow-lg' : 'bg-stone-100 dark:bg-zinc-800 text-stone-400'}`}
                                            >
                                                Tarefa
                                            </button>
                                            <button
                                                onClick={() => setNewTask({ ...newTask, type: 'note' })}
                                                className={`flex-1 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${newTask.type === 'note' ? 'bg-yellow-400 text-white shadow-lg' : 'bg-stone-100 dark:bg-zinc-800 text-stone-400'}`}
                                            >
                                                Nota
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Data</p>
                                                <input
                                                    type="date"
                                                    value={newTask.date}
                                                    onChange={e => setNewTask({ ...newTask, date: e.target.value })}
                                                    className="w-full font-black bg-white dark:bg-zinc-800 rounded-[2rem] border-none shadow-sm p-6 focus:ring-4 focus:ring-brand-light dark:text-zinc-100"
                                                />
                                            </div>
                                            {newTask.type !== 'note' && (
                                                <div className="space-y-2">
                                                    <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Horário</p>
                                                    <input
                                                        type="time"
                                                        value={newTask.time}
                                                        onChange={e => setNewTask({ ...newTask, time: e.target.value })}
                                                        className="w-full font-black bg-white dark:bg-zinc-800 rounded-[2rem] border-none shadow-sm p-6 focus:ring-4 focus:ring-brand-light dark:text-zinc-100"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {newTask.type !== 'note' && (
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-2">
                                                    <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Categoria</p>
                                                    <select
                                                        value={newTask.cat}
                                                        onChange={e => setNewTask({ ...newTask, cat: e.target.value })}
                                                        className="w-full font-black bg-white dark:bg-zinc-800 rounded-[2rem] border-none shadow-sm p-6 focus:ring-4 focus:ring-brand-light dark:focus:ring-brand-light/20 appearance-none dark:text-zinc-100"
                                                    >
                                                        {Object.keys(CATEGORIES).map(c => <option key={c}>{c}</option>)}
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Alarme</p>
                                                    <div className="flex gap-2">
                                                        {['Sim', 'Não', 'Padrão'].map(opt => (
                                                            <button
                                                                key={opt}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (!isPremium && opt !== 'Padrão') {
                                                                        showAppAlert("Notificações Avançadas", "A escolha individual de alarme por tarefa é um recurso Premium 🔔");
                                                                        setShowPremiumAd(true);
                                                                    } else {
                                                                        setNewTask({ ...newTask, alarm: opt });
                                                                    }
                                                                }}
                                                                className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${newTask.alarm === opt ? 'bg-brand text-white shadow-lg' : 'bg-stone-50 dark:bg-zinc-800 text-stone-400'} ${!isPremium && opt !== 'Padrão' ? 'opacity-50' : ''}`}
                                                            >
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleAddTask}
                                        className="w-full py-6 bg-brand text-white rounded-[2.5rem] font-black text-xl shadow-2xl active:scale-95 transition-all mt-4 hover:brightness-90"
                                        style={{ boxShadow: '0 20px 40px var(--primary-shadow)' }}
                                    >
                                        {newTask.type === 'note' ? 'Salvar Nota' : 'Confirmar Bagunça'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {showAddGoal && (
                        <div className="fixed inset-0 bg-stone-200/40 dark:bg-black/80 backdrop-blur-sm z-[100] flex flex-col justify-end" onClick={() => setShowAddGoal(false)}>
                            <div className="bg-white dark:bg-zinc-900 modal-card rounded-t-[4rem] p-10 animate-content shadow-2xl" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-3xl font-black text-stone-800 dark:text-zinc-100 tracking-tighter">Nova Meta</h3>
                                    <button onClick={() => setShowAddGoal(false)} className="size-10 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300 active:scale-90 transition-all border-none">
                                        <span className="material-symbols-outlined font-black">close</span>
                                    </button>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">O que quer conquistar?</p>
                                        <input
                                            type="text"
                                            placeholder="Ex: Ler 3 livros"
                                            value={newGoal.title}
                                            onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                                            className="w-full text-2xl font-black bg-white dark:bg-zinc-800 rounded-[2rem] border-none shadow-sm focus:ring-4 focus:ring-brand-light dark:focus:ring-brand-light/20 p-6 placeholder:text-stone-300 dark:placeholder:text-zinc-600 dark:text-zinc-100"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Freq. Semanal</p>
                                                <select
                                                    value={newGoal.frequency}
                                                    onChange={e => setNewGoal({ ...newGoal, frequency: parseInt(e.target.value) })}
                                                    className="w-full font-black bg-stone-50 dark:bg-zinc-800 rounded-2xl border-none shadow-sm p-4 text-xs dark:text-zinc-100"
                                                >
                                                    {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}x por semana</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Horário</p>
                                                <input
                                                    type="time"
                                                    value={newGoal.hours[0]}
                                                    onChange={e => setNewGoal({ ...newGoal, hours: [e.target.value] })}
                                                    className="w-full font-black bg-stone-50 dark:bg-zinc-800 rounded-2xl border-none shadow-sm p-4 text-xs dark:text-zinc-100"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Dias da Semana</p>
                                            <div className="flex justify-between gap-1 overflow-x-auto pb-2 no-scrollbar">
                                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => {
                                                            const nd = newGoal.days.includes(i)
                                                                ? newGoal.days.filter(x => x !== i)
                                                                : [...newGoal.days, i];
                                                            setNewGoal({ ...newGoal, days: nd });
                                                        }}
                                                        className={`size-10 rounded-xl font-black text-xs transition-all ${newGoal.days.includes(i) ? 'bg-brand text-white shadow-lg' : 'bg-stone-50 dark:bg-zinc-800 text-stone-400'}`}
                                                    >
                                                        {d}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest ml-1">Progresso Inicial: {newGoal.progress}%</p>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={newGoal.progress}
                                                onChange={e => setNewGoal({ ...newGoal, progress: parseInt(e.target.value) })}
                                                className="w-full accent-brand h-2 bg-stone-50 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <button onClick={handleAddGoal} className="w-full py-6 bg-brand text-white text-xl font-black rounded-[2.5rem] shadow-xl shadow-brand/20 active:scale-95 transition-all mt-4">Definir Meta</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {alertModal.show && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-stone-200/40 dark:bg-black/60 backdrop-blur-sm animate-content">
                    <div className="absolute inset-0" onClick={() => !alertModal.isConfirm && setAlertModal({ ...alertModal, show: false })}></div>
                    <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl border border-stone-100 dark:border-zinc-800 p-8 flex flex-col items-center text-center">
                        <div className={`size-16 rounded-2xl flex items-center justify-center mb-6 ${alertModal.isConfirm ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-brand-light dark:bg-brand-shadow text-brand'}`}>
                            <span className="material-symbols-outlined text-3xl filled">
                                {alertModal.isConfirm ? 'help' : (alertModal.title === 'Erro' ? 'error' : (alertModal.title === 'Aviso' ? 'warning' : 'info'))}
                            </span>
                        </div>
                        <h3 className="text-xl font-black text-stone-800 dark:text-zinc-100 tracking-tight mb-2">{alertModal.title}</h3>
                        <p className="text-sm font-medium text-stone-500 dark:text-zinc-400 leading-relaxed mb-8">{alertModal.body}</p>

                        <div className="flex flex-col w-full gap-3">
                            <button
                                onClick={() => {
                                    if (alertModal.isConfirm && alertModal.onConfirm) alertModal.onConfirm();
                                    else setAlertModal({ ...alertModal, show: false });
                                }}
                                className={`w-full py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all ${alertModal.isConfirm ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-brand text-white shadow-brand/20'}`}
                            >
                                {alertModal.isConfirm ? 'Confirmar' : 'Entendi'}
                            </button>
                            {alertModal.isConfirm && (
                                <button
                                    onClick={() => alertModal.onCancel ? alertModal.onCancel() : setAlertModal({ ...alertModal, show: false })}
                                    className="w-full py-4 bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 rounded-2xl font-black text-sm active:scale-95 transition-all"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {docModal.show && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDocModal({ show: false, title: '', content: '' })}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-[#071025] modal-card rounded-2xl shadow-2xl p-0 max-h-[86vh] overflow-hidden">
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

            {updateRequired && updateInfo && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1000] flex items-center justify-center p-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-10 max-w-md w-full shadow-2xl border-4 border-brand animate-content">
                        <div className="text-center space-y-6">
                            <div className="size-24 mx-auto rounded-full bg-brand/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-6xl text-brand filled">system_update</span>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-stone-800 dark:text-zinc-100 tracking-tight">Atualização Necessária</h2>
                                <p className="text-sm text-stone-600 dark:text-zinc-400 leading-relaxed">
                                    {updateInfo.updateMessage}
                                </p>
                            </div>
                            <div className="bg-stone-50 dark:bg-zinc-800/50 rounded-2xl p-4 space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest">Versão Atual</span>
                                    <span className="font-black text-stone-600 dark:text-zinc-300">{APP_VERSION}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-widest">Nova Versão</span>
                                    <span className="font-black text-brand">{updateInfo.latestVersion}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => window.open(updateInfo.downloadUrl, '_system')}
                                className="w-full py-5 bg-brand text-white rounded-[2rem] font-black text-lg shadow-2xl active:scale-95 transition-all"
                                style={{ boxShadow: '0 20px 40px var(--primary-shadow)' }}
                            >
                                Baixar Atualização
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Premium Activation Modal */}
            <PremiumModal show={showPremiumAd} onClose={() => setShowPremiumAd(false)} />
        </>
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
