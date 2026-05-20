import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

const STORAGE_KEY = 'harmony-school-crm-data-v1';
const captchaSiteKey = process.env.REACT_APP_YANDEX_CAPTCHA_SITE_KEY || '';
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabaseTable = process.env.REACT_APP_SUPABASE_TABLE || 'music_school_data';

const initialData = {
  students: [
    {
      id: 'student-1',
      name: 'Алиса Морозова',
      age: 12,
      instrument: 'Фортепиано',
      phone: '+7 999 120-45-22',
      parent: 'Екатерина Морозова',
      status: 'active',
      createdAt: '2026-05-01',
    },
    {
      id: 'student-2',
      name: 'Марк Лебедев',
      age: 15,
      instrument: 'Гитара',
      phone: '+7 999 321-66-10',
      parent: 'Игорь Лебедев',
      status: 'active',
      createdAt: '2026-05-08',
    },
    {
      id: 'student-3',
      name: 'София Орлова',
      age: 9,
      instrument: 'Вокал',
      phone: '+7 999 777-11-88',
      parent: 'Анна Орлова',
      status: 'trial',
      createdAt: '2026-05-14',
    },
  ],
  plans: [
    { id: 'plan-1', title: 'Старт', lessons: 4, price: 5200, durationDays: 30, color: '#7c3aed' },
    { id: 'plan-2', title: 'Классика', lessons: 8, price: 9600, durationDays: 45, color: '#0f766e' },
    { id: 'plan-3', title: 'Интенсив', lessons: 12, price: 13200, durationDays: 60, color: '#dc2626' },
  ],
  subscriptions: [
    {
      id: 'subscription-1',
      studentId: 'student-1',
      planId: 'plan-2',
      startsAt: '2026-05-01',
      expiresAt: '2026-06-15',
      lessonsTotal: 8,
      lessonsLeft: 5,
      paid: true,
      amount: 9600,
      status: 'active',
    },
    {
      id: 'subscription-2',
      studentId: 'student-2',
      planId: 'plan-1',
      startsAt: '2026-05-10',
      expiresAt: '2026-06-09',
      lessonsTotal: 4,
      lessonsLeft: 2,
      paid: false,
      amount: 5200,
      status: 'active',
    },
  ],
  lessons: [
    { id: 'lesson-1', studentId: 'student-1', date: '2026-05-21', time: '16:00', teacher: 'Елена Сергеевна', topic: 'Этюды и ритм', status: 'scheduled' },
    { id: 'lesson-2', studentId: 'student-2', date: '2026-05-22', time: '18:30', teacher: 'Артём Николаевич', topic: 'Аккорды и перебор', status: 'scheduled' },
  ],
};

const emptyStudent = { name: '', age: '', instrument: 'Фортепиано', phone: '', parent: '', status: 'trial' };
const emptyPlan = { title: '', lessons: 8, price: 9000, durationDays: 30, color: '#7c3aed' };
const emptyLesson = { studentId: '', date: '', time: '', teacher: '', topic: '', status: 'scheduled' };

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days));
  return next.toISOString().slice(0, 10);
}

function formatMoney(value) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value || 0);
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU').format(new Date(value));
}

async function loadCloudData() {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const response = await fetch(`${supabaseUrl}/rest/v1/${supabaseTable}?id=eq.default&select=data`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) throw new Error('Не удалось загрузить данные из Supabase');
  const rows = await response.json();
  return rows?.[0]?.data || null;
}

async function saveCloudData(data) {
  if (!supabaseUrl || !supabaseAnonKey) return;

  const response = await fetch(`${supabaseUrl}/rest/v1/${supabaseTable}?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify([{ id: 'default', data, updated_at: new Date().toISOString() }]),
  });

  if (!response.ok) throw new Error('Не удалось сохранить данные в Supabase');
}

function CaptchaGate({ onVerified }) {
  const [status, setStatus] = useState(captchaSiteKey ? 'Загрузка SmartCaptcha...' : 'Демо-режим: ключ Яндекс SmartCaptcha не задан');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!captchaSiteKey) return undefined;

    window.smartCaptchaCallback = async (token) => {
      setIsVerifying(true);
      try {
        const result = await fetch('/api/verify-captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (result.ok) {
          onVerified();
          return;
        }

        setStatus('Капча пройдена, но серверная проверка не настроена. Проверьте YANDEX_CAPTCHA_SECRET_KEY.');
      } catch (error) {
        setStatus('Не удалось проверить капчу на сервере. Для разработки можно использовать демо-вход.');
      } finally {
        setIsVerifying(false);
      }
    };

    const existing = document.querySelector('script[data-smartcaptcha]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://smartcaptcha.yandexcloud.net/captcha.js';
      script.async = true;
      script.defer = true;
      script.dataset.smartcaptcha = 'true';
      script.onload = () => setStatus('Подтвердите, что вы не робот');
      script.onerror = () => setStatus('Не удалось загрузить Яндекс SmartCaptcha');
      document.body.appendChild(script);
    } else {
      setStatus('Подтвердите, что вы не робот');
    }

    return () => {
      delete window.smartCaptchaCallback;
    };
  }, [onVerified]);

  return (
    <main className="captcha-page">
      <section className="captcha-card">
        <div className="brand-mark">♪</div>
        <p className="eyebrow">Harmony School</p>
        <h1>CRM для музыкальной школы</h1>
        <p className="muted">Перед входом администратор проходит Яндекс SmartCaptcha. После проверки открывается панель учеников, абонементов, занятий и оплат.</p>

        {captchaSiteKey ? (
          <div className="captcha-box">
            <div
              className="smart-captcha"
              data-sitekey={captchaSiteKey}
              data-callback="smartCaptchaCallback"
            />
            <p>{isVerifying ? 'Проверяем токен...' : status}</p>
          </div>
        ) : (
          <div className="captcha-box demo-captcha">
            <strong>SmartCaptcha готова к подключению</strong>
            <p>{status}. Добавьте REACT_APP_YANDEX_CAPTCHA_SITE_KEY и YANDEX_CAPTCHA_SECRET_KEY на хостинге.</p>
            <button className="primary-button" onClick={onVerified}>Войти в демо-панель</button>
          </div>
        )}
      </section>
    </main>
  );
}

function App() {
  const [captchaPassed, setCaptchaPassed] = useState(() => sessionStorage.getItem('captchaPassed') === 'true');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(() => {
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      return local ? JSON.parse(local) : initialData;
    } catch (error) {
      return initialData;
    }
  });
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [subscriptionForm, setSubscriptionForm] = useState({ studentId: '', planId: '', startsAt: new Date().toISOString().slice(0, 10), paid: true });
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [storageStatus, setStorageStatus] = useState(supabaseUrl && supabaseAnonKey ? 'Загрузка данных...' : 'Демо-хранение: данные сохраняются в браузере');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!captchaPassed) return undefined;

    let cancelled = false;

    async function hydrate() {
      try {
        if (!supabaseUrl || !supabaseAnonKey) {
          setStorageStatus('Демо-хранение: данные сохраняются в браузере');
          return;
        }

        const cloud = await loadCloudData();
        if (!cancelled && cloud) {
          setData(cloud);
          setStorageStatus('Данные синхронизированы с Supabase');
        }
      } catch (error) {
        const local = localStorage.getItem(STORAGE_KEY);
        if (!cancelled) {
          setData(local ? JSON.parse(local) : initialData);
          setStorageStatus('Supabase недоступен, включено локальное демо-хранение');
        }
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [captchaPassed]);

  useEffect(() => {
    if (!captchaPassed) return undefined;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const timeout = setTimeout(() => {
      saveCloudData(data)
        .then(() => {
          if (supabaseUrl && supabaseAnonKey) setStorageStatus('Данные сохранены в Supabase');
        })
        .catch(() => setStorageStatus('Не удалось сохранить в Supabase, локальная копия обновлена'));
    }, 500);

    return () => clearTimeout(timeout);
  }, [captchaPassed, data]);

  const studentsById = useMemo(() => Object.fromEntries(data.students.map((student) => [student.id, student])), [data.students]);
  const plansById = useMemo(() => Object.fromEntries(data.plans.map((plan) => [plan.id, plan])), [data.plans]);

  const stats = useMemo(() => {
    const activeSubscriptions = data.subscriptions.filter((subscription) => subscription.status === 'active');
    const paidRevenue = data.subscriptions.filter((subscription) => subscription.paid).reduce((sum, subscription) => sum + Number(subscription.amount), 0);
    const debt = data.subscriptions.filter((subscription) => !subscription.paid).reduce((sum, subscription) => sum + Number(subscription.amount), 0);
    const lessonsLeft = activeSubscriptions.reduce((sum, subscription) => sum + Number(subscription.lessonsLeft), 0);

    return {
      students: data.students.length,
      activeSubscriptions: activeSubscriptions.length,
      paidRevenue,
      debt,
      lessonsLeft,
      scheduledLessons: data.lessons.filter((lesson) => lesson.status === 'scheduled').length,
    };
  }, [data]);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return data.students;
    return data.students.filter((student) => [student.name, student.instrument, student.phone, student.parent].join(' ').toLowerCase().includes(normalizedQuery));
  }, [data.students, query]);

  function passCaptcha() {
    sessionStorage.setItem('captchaPassed', 'true');
    setCaptchaPassed(true);
  }

  function submitStudent(event) {
    event.preventDefault();
    if (!studentForm.name.trim() || !studentForm.phone.trim()) return;

    if (editingStudentId) {
      setData((current) => ({
        ...current,
        students: current.students.map((student) => student.id === editingStudentId ? { ...student, ...studentForm, age: Number(studentForm.age || 0) } : student),
      }));
      setEditingStudentId(null);
    } else {
      setData((current) => ({
        ...current,
        students: [{ ...studentForm, id: createId('student'), age: Number(studentForm.age || 0), createdAt: new Date().toISOString().slice(0, 10) }, ...current.students],
      }));
    }

    setStudentForm(emptyStudent);
  }

  function editStudent(student) {
    setEditingStudentId(student.id);
    setStudentForm({ name: student.name, age: student.age, instrument: student.instrument, phone: student.phone, parent: student.parent, status: student.status });
    setActiveTab('students');
  }

  function removeStudent(studentId) {
    setData((current) => ({
      ...current,
      students: current.students.filter((student) => student.id !== studentId),
      subscriptions: current.subscriptions.filter((subscription) => subscription.studentId !== studentId),
      lessons: current.lessons.filter((lesson) => lesson.studentId !== studentId),
    }));
  }

  function submitPlan(event) {
    event.preventDefault();
    if (!planForm.title.trim()) return;
    setData((current) => ({ ...current, plans: [{ ...planForm, id: createId('plan'), lessons: Number(planForm.lessons), price: Number(planForm.price), durationDays: Number(planForm.durationDays) }, ...current.plans] }));
    setPlanForm(emptyPlan);
  }

  function submitSubscription(event) {
    event.preventDefault();
    const plan = plansById[subscriptionForm.planId];
    if (!subscriptionForm.studentId || !plan) return;

    const startsAt = subscriptionForm.startsAt || new Date().toISOString().slice(0, 10);
    const newSubscription = {
      id: createId('subscription'),
      studentId: subscriptionForm.studentId,
      planId: plan.id,
      startsAt,
      expiresAt: addDays(startsAt, plan.durationDays),
      lessonsTotal: Number(plan.lessons),
      lessonsLeft: Number(plan.lessons),
      paid: subscriptionForm.paid,
      amount: Number(plan.price),
      status: 'active',
    };

    setData((current) => ({ ...current, subscriptions: [newSubscription, ...current.subscriptions] }));
    setSubscriptionForm({ studentId: '', planId: '', startsAt: new Date().toISOString().slice(0, 10), paid: true });
  }

  function submitLesson(event) {
    event.preventDefault();
    if (!lessonForm.studentId || !lessonForm.date || !lessonForm.time) return;
    setData((current) => ({ ...current, lessons: [{ ...lessonForm, id: createId('lesson') }, ...current.lessons] }));
    setLessonForm(emptyLesson);
  }

  function markLessonDone(lessonId, studentId) {
    setData((current) => {
      const activeSubscription = current.subscriptions.find((subscription) => subscription.studentId === studentId && subscription.status === 'active' && subscription.lessonsLeft > 0);

      return {
        ...current,
        lessons: current.lessons.map((lesson) => lesson.id === lessonId ? { ...lesson, status: 'done' } : lesson),
        subscriptions: current.subscriptions.map((subscription) => {
          if (!activeSubscription || subscription.id !== activeSubscription.id) return subscription;
          const lessonsLeft = Math.max(0, Number(subscription.lessonsLeft) - 1);
          return { ...subscription, lessonsLeft, status: lessonsLeft === 0 ? 'finished' : subscription.status };
        }),
      };
    });
  }

  function togglePayment(subscriptionId) {
    setData((current) => ({
      ...current,
      subscriptions: current.subscriptions.map((subscription) => subscription.id === subscriptionId ? { ...subscription, paid: !subscription.paid } : subscription),
    }));
  }

  function resetDemoData() {
    setData(initialData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  }

  if (!captchaPassed) return <CaptchaGate onVerified={passCaptcha} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo"><span>♪</span><div><strong>Harmony</strong><small>music school</small></div></div>
        <nav>
          {[
            ['dashboard', 'Обзор'],
            ['students', 'Ученики'],
            ['subscriptions', 'Абонементы'],
            ['lessons', 'Занятия'],
            ['settings', 'Деплой'],
          ].map(([id, label]) => (
            <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>{label}</button>
          ))}
        </nav>
        <div className="storage-pill">{storageStatus}</div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Учебный проект</p>
            <h1>Панель управления музыкальной школой</h1>
          </div>
          <button className="ghost-button" onClick={() => { sessionStorage.removeItem('captchaPassed'); setCaptchaPassed(false); }}>Проверить капчу заново</button>
        </header>

        {activeTab === 'dashboard' && (
          <section className="page-grid">
            <div className="hero-card">
              <p className="eyebrow">Сегодня в школе</p>
              <h2>Контролируйте учеников, абонементы, занятия и долги в одном месте.</h2>
              <p>Интерфейс рассчитан на администратора музыкальной школы: быстрые формы, наглядные статусы и готовность к бесплатному облачному хранению Supabase.</p>
            </div>
            <div className="stats-grid">
              <Stat title="Ученики" value={stats.students} note="в базе" />
              <Stat title="Активные абонементы" value={stats.activeSubscriptions} note={`${stats.lessonsLeft} занятий осталось`} />
              <Stat title="Оплачено" value={formatMoney(stats.paidRevenue)} note="выручка" />
              <Stat title="Долги" value={formatMoney(stats.debt)} note="к оплате" danger />
              <Stat title="Запланировано" value={stats.scheduledLessons} note="занятий" />
            </div>
            <Panel title="Ближайшие занятия">
              <div className="list">
                {data.lessons.filter((lesson) => lesson.status === 'scheduled').slice(0, 5).map((lesson) => (
                  <div className="list-row" key={lesson.id}>
                    <div><strong>{studentsById[lesson.studentId]?.name || 'Ученик удалён'}</strong><span>{lesson.topic || 'Без темы'} · {lesson.teacher || 'Преподаватель не указан'}</span></div>
                    <span className="badge">{formatDate(lesson.date)} · {lesson.time}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeTab === 'students' && (
          <section className="two-column">
            <Panel title={editingStudentId ? 'Редактировать ученика' : 'Добавить ученика'}>
              <form className="form" onSubmit={submitStudent}>
                <label>ФИО<input value={studentForm.name} onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })} placeholder="Иван Петров" /></label>
                <label>Возраст<input type="number" min="3" value={studentForm.age} onChange={(event) => setStudentForm({ ...studentForm, age: event.target.value })} placeholder="12" /></label>
                <label>Инструмент<select value={studentForm.instrument} onChange={(event) => setStudentForm({ ...studentForm, instrument: event.target.value })}><option>Фортепиано</option><option>Гитара</option><option>Вокал</option><option>Скрипка</option><option>Барабаны</option><option>Сольфеджио</option></select></label>
                <label>Телефон<input value={studentForm.phone} onChange={(event) => setStudentForm({ ...studentForm, phone: event.target.value })} placeholder="+7 999 000-00-00" /></label>
                <label>Родитель / контакт<input value={studentForm.parent} onChange={(event) => setStudentForm({ ...studentForm, parent: event.target.value })} placeholder="Мария Петрова" /></label>
                <label>Статус<select value={studentForm.status} onChange={(event) => setStudentForm({ ...studentForm, status: event.target.value })}><option value="trial">Пробный урок</option><option value="active">Активный</option><option value="paused">Пауза</option></select></label>
                <button className="primary-button" type="submit">{editingStudentId ? 'Сохранить изменения' : 'Добавить ученика'}</button>
                {editingStudentId && <button className="ghost-button" type="button" onClick={() => { setEditingStudentId(null); setStudentForm(emptyStudent); }}>Отмена</button>}
              </form>
            </Panel>
            <Panel title="Ученики">
              <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по имени, телефону или инструменту" />
              <div className="cards-list">
                {filteredStudents.map((student) => (
                  <article className="student-card" key={student.id}>
                    <div className="avatar">{student.name.slice(0, 1)}</div>
                    <div>
                      <h3>{student.name}</h3>
                      <p>{student.age || '—'} лет · {student.instrument}</p>
                      <p>{student.phone} · {student.parent || 'контакт не указан'}</p>
                      <span className={`status ${student.status}`}>{student.status === 'active' ? 'Активный' : student.status === 'trial' ? 'Пробный' : 'Пауза'}</span>
                    </div>
                    <div className="card-actions"><button onClick={() => editStudent(student)}>Изменить</button><button onClick={() => removeStudent(student.id)}>Удалить</button></div>
                  </article>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeTab === 'subscriptions' && (
          <section className="two-column">
            <div className="stack">
              <Panel title="Новый абонемент">
                <form className="form" onSubmit={submitSubscription}>
                  <label>Ученик<select value={subscriptionForm.studentId} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, studentId: event.target.value })}><option value="">Выберите ученика</option>{data.students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
                  <label>Тариф<select value={subscriptionForm.planId} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, planId: event.target.value })}><option value="">Выберите тариф</option>{data.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title} · {plan.lessons} занятий · {formatMoney(plan.price)}</option>)}</select></label>
                  <label>Дата начала<input type="date" value={subscriptionForm.startsAt} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, startsAt: event.target.value })} /></label>
                  <label className="checkbox"><input type="checkbox" checked={subscriptionForm.paid} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, paid: event.target.checked })} /> Оплачен</label>
                  <button className="primary-button" type="submit">Выдать абонемент</button>
                </form>
              </Panel>
              <Panel title="Создать тариф">
                <form className="form compact" onSubmit={submitPlan}>
                  <label>Название<input value={planForm.title} onChange={(event) => setPlanForm({ ...planForm, title: event.target.value })} placeholder="Семейный" /></label>
                  <label>Занятий<input type="number" min="1" value={planForm.lessons} onChange={(event) => setPlanForm({ ...planForm, lessons: event.target.value })} /></label>
                  <label>Цена<input type="number" min="0" value={planForm.price} onChange={(event) => setPlanForm({ ...planForm, price: event.target.value })} /></label>
                  <label>Дней действия<input type="number" min="1" value={planForm.durationDays} onChange={(event) => setPlanForm({ ...planForm, durationDays: event.target.value })} /></label>
                  <button className="ghost-button" type="submit">Добавить тариф</button>
                </form>
              </Panel>
            </div>
            <Panel title="Абонементы">
              <div className="subscription-grid">
                {data.subscriptions.map((subscription) => {
                  const student = studentsById[subscription.studentId];
                  const plan = plansById[subscription.planId];
                  const progress = subscription.lessonsTotal ? Math.round(((subscription.lessonsTotal - subscription.lessonsLeft) / subscription.lessonsTotal) * 100) : 0;
                  return (
                    <article className="subscription-card" key={subscription.id}>
                      <div className="subscription-head"><span style={{ backgroundColor: plan?.color || '#7c3aed' }}>{plan?.title || 'Тариф удалён'}</span><button onClick={() => togglePayment(subscription.id)}>{subscription.paid ? 'Оплачено' : 'Долг'}</button></div>
                      <h3>{student?.name || 'Ученик удалён'}</h3>
                      <p>{formatDate(subscription.startsAt)} — {formatDate(subscription.expiresAt)}</p>
                      <div className="progress"><i style={{ width: `${progress}%` }} /></div>
                      <p>{subscription.lessonsLeft} из {subscription.lessonsTotal} занятий осталось · {formatMoney(subscription.amount)}</p>
                    </article>
                  );
                })}
              </div>
            </Panel>
          </section>
        )}

        {activeTab === 'lessons' && (
          <section className="two-column">
            <Panel title="Запланировать занятие">
              <form className="form" onSubmit={submitLesson}>
                <label>Ученик<select value={lessonForm.studentId} onChange={(event) => setLessonForm({ ...lessonForm, studentId: event.target.value })}><option value="">Выберите ученика</option>{data.students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
                <label>Дата<input type="date" value={lessonForm.date} onChange={(event) => setLessonForm({ ...lessonForm, date: event.target.value })} /></label>
                <label>Время<input type="time" value={lessonForm.time} onChange={(event) => setLessonForm({ ...lessonForm, time: event.target.value })} /></label>
                <label>Преподаватель<input value={lessonForm.teacher} onChange={(event) => setLessonForm({ ...lessonForm, teacher: event.target.value })} placeholder="Елена Сергеевна" /></label>
                <label>Тема<input value={lessonForm.topic} onChange={(event) => setLessonForm({ ...lessonForm, topic: event.target.value })} placeholder="Разбор произведения" /></label>
                <button className="primary-button" type="submit">Добавить занятие</button>
              </form>
            </Panel>
            <Panel title="Расписание">
              <div className="list">
                {data.lessons.map((lesson) => (
                  <div className="list-row lesson-row" key={lesson.id}>
                    <div><strong>{studentsById[lesson.studentId]?.name || 'Ученик удалён'}</strong><span>{formatDate(lesson.date)} · {lesson.time} · {lesson.teacher || 'Без преподавателя'} · {lesson.topic || 'Без темы'}</span></div>
                    {lesson.status === 'scheduled' ? <button onClick={() => markLessonDone(lesson.id, lesson.studentId)}>Проведено</button> : <span className="status active">Проведено</span>}
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="settings-page">
            <Panel title="Бесплатное развертывание">
              <div className="deploy-steps">
                <div><strong>1. Vercel или Netlify</strong><p>Подключите GitHub-репозиторий, build command: <code>npm run build</code>, publish directory: <code>build</code>.</p></div>
                <div><strong>2. Yandex SmartCaptcha</strong><p>Создайте капчу в Yandex Cloud и добавьте <code>REACT_APP_YANDEX_CAPTCHA_SITE_KEY</code> и <code>YANDEX_CAPTCHA_SECRET_KEY</code>.</p></div>
                <div><strong>3. Supabase Free</strong><p>Создайте таблицу <code>music_school_data</code> по SQL из README и добавьте <code>REACT_APP_SUPABASE_URL</code>, <code>REACT_APP_SUPABASE_ANON_KEY</code>.</p></div>
              </div>
              <button className="ghost-button" onClick={resetDemoData}>Сбросить демо-данные</button>
            </Panel>
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ title, value, note, danger }) {
  return <div className={`stat-card ${danger ? 'danger' : ''}`}><span>{title}</span><strong>{value}</strong><small>{note}</small></div>;
}

function Panel({ title, children }) {
  return <section className="panel"><div className="panel-title"><h2>{title}</h2></div>{children}</section>;
}

export default App;
