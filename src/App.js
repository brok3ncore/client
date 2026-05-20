import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const CAPTCHA_SITE_KEY = process.env.REACT_APP_YANDEX_CAPTCHA_SITEKEY || '';
const CLOUD_API_URL = process.env.REACT_APP_CLOUD_API_URL || '/.netlify/functions/school-state';
const SUPABASE_STATE_ID = process.env.REACT_APP_SUPABASE_STATE_ID || 'music-school-demo';
const STORAGE_KEY = 'solfejio_music_school_state_v1';
const CAPTCHA_SESSION_KEY = 'solfejio_captcha_passed';

const starterStudents = [
  {
    id: 'student-anna',
    name: 'Анна Волкова',
    age: '12',
    phone: '+7 900 111-22-33',
    instrument: 'Фортепиано',
    teacher: 'Мария Орлова',
    status: 'Активен',
    note: 'Готовится к школьному концерту',
    createdAt: '2026-05-01',
  },
  {
    id: 'student-maksim',
    name: 'Максим Егоров',
    age: '15',
    phone: '+7 901 555-17-88',
    instrument: 'Гитара',
    teacher: 'Илья Соколов',
    status: 'Активен',
    note: 'Любит импровизацию и рок-аранжировки',
    createdAt: '2026-05-03',
  },
];

const starterSubscriptions = [
  {
    id: 'sub-anna-may',
    studentId: 'student-anna',
    planName: 'Индивидуальный стандарт',
    totalLessons: 8,
    remainingLessons: 5,
    price: 9600,
    startDate: '2026-05-01',
    endDate: '2026-06-01',
    status: 'Активен',
  },
  {
    id: 'sub-maksim-may',
    studentId: 'student-maksim',
    planName: 'Гитара интенсив',
    totalLessons: 12,
    remainingLessons: 9,
    price: 14400,
    startDate: '2026-05-04',
    endDate: '2026-06-04',
    status: 'Активен',
  },
];

const starterLessons = [
  {
    id: 'lesson-1',
    studentId: 'student-anna',
    subscriptionId: 'sub-anna-may',
    date: '2026-05-21',
    time: '16:00',
    topic: 'Подготовка этюда и гаммы',
    status: 'Запланирован',
  },
  {
    id: 'lesson-2',
    studentId: 'student-maksim',
    subscriptionId: 'sub-maksim-may',
    date: '2026-05-22',
    time: '18:30',
    topic: 'Ритм, бой и разбор песни',
    status: 'Запланирован',
  },
];

const plans = [
  { name: 'Пробный урок', lessons: 1, price: 900 },
  { name: 'Индивидуальный стандарт', lessons: 8, price: 9600 },
  { name: 'Группа солфеджио', lessons: 8, price: 6400 },
  { name: 'Интенсив', lessons: 12, price: 14400 },
];

const emptyStudent = {
  name: '',
  age: '',
  phone: '',
  instrument: 'Фортепиано',
  teacher: '',
  note: '',
};

const today = new Date().toISOString().slice(0, 10);

const initialState = {
  students: starterStudents,
  subscriptions: starterSubscriptions,
  lessons: starterLessons,
};

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatMoney(value) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);
}

function getStudentName(students, studentId) {
  return students.find((student) => student.id === studentId)?.name || 'Ученик не найден';
}

function loadLocalState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialState;
  } catch (error) {
    return initialState;
  }
}

function normalizeSchoolState(data) {
  const students = Array.isArray(data?.students) ? data.students : [];
  const subscriptions = Array.isArray(data?.subscriptions) ? data.subscriptions : [];
  const lessons = Array.isArray(data?.lessons) ? data.lessons : [];
  return { students, subscriptions, lessons };
}

async function loadCloudState(captchaToken) {
  if (!captchaToken) return null;

  const response = await fetch(`${CLOUD_API_URL}?id=${encodeURIComponent(SUPABASE_STATE_ID)}`, {
    headers: {
      'x-captcha-token': captchaToken,
    },
  });

  if (response.status === 404) return { data: null, sessionToken: '' };
  if (!response.ok) throw new Error('Не удалось загрузить данные из Supabase');
  return response.json();
}

async function saveCloudState(data, cloudSessionToken) {
  if (!cloudSessionToken) return 'local';

  const response = await fetch(CLOUD_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cloud-session-token': cloudSessionToken,
    },
    body: JSON.stringify({ id: SUPABASE_STATE_ID, data }),
  });

  if (!response.ok) throw new Error('Не удалось сохранить данные в Supabase');
  return 'cloud';
}

function App() {
  const captchaRef = useRef(null);
  const [captchaPassed, setCaptchaPassed] = useState(() => window.sessionStorage.getItem(CAPTCHA_SESSION_KEY) === 'true');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReady, setCaptchaReady] = useState(!CAPTCHA_SITE_KEY);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState(initialState.students);
  const [subscriptions, setSubscriptions] = useState(initialState.subscriptions);
  const [lessons, setLessons] = useState(initialState.lessons);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [subscriptionForm, setSubscriptionForm] = useState({ studentId: starterStudents[0].id, planName: plans[1].name, startDate: today });
  const [lessonForm, setLessonForm] = useState({ studentId: starterStudents[0].id, subscriptionId: starterSubscriptions[0].id, date: today, time: '17:00', topic: '' });
  const [syncStatus, setSyncStatus] = useState('Загрузка данных...');
  const [hydrated, setHydrated] = useState(false);
  const [cloudSessionToken, setCloudSessionToken] = useState('');

  const stateSnapshot = useMemo(() => ({ students, subscriptions, lessons }), [students, subscriptions, lessons]);
  const cloudEnabled = Boolean(cloudSessionToken || captchaToken);

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === 'Активен');
  const income = subscriptions.reduce((sum, subscription) => sum + Number(subscription.price || 0), 0);
  const plannedLessons = lessons.filter((lesson) => lesson.status === 'Запланирован');
  const completedLessons = lessons.filter((lesson) => lesson.status === 'Проведен');

  useEffect(() => {
    const applyState = (nextState) => {
      const normalized = normalizeSchoolState(nextState);
      setStudents(normalized.students);
      setSubscriptions(normalized.subscriptions);
      setLessons(normalized.lessons);
      setSubscriptionForm((current) => ({ ...current, studentId: normalized.students[0]?.id || '' }));
      setLessonForm((current) => ({
        ...current,
        studentId: normalized.students[0]?.id || '',
        subscriptionId: normalized.subscriptions.find((subscription) => subscription.studentId === normalized.students[0]?.id)?.id || '',
      }));
    };

    applyState(loadLocalState());

    if (!captchaPassed) {
      setSyncStatus('Работает локальное демо-хранилище');
      setHydrated(true);
      return;
    }

    loadCloudState(captchaToken)
      .then((cloudState) => {
        if (cloudState?.sessionToken) {
          setCloudSessionToken(cloudState.sessionToken);
        }
        if (cloudState?.data) {
          applyState(cloudState.data);
          setSyncStatus('Данные загружены из Supabase через защищенную функцию');
        } else {
          setSyncStatus(captchaToken ? 'Supabase подключен, используется новая база' : 'Работает локальное демо-хранилище');
        }
      })
      .catch(() => setSyncStatus('Supabase недоступен, включен локальный резерв'))
      .finally(() => setHydrated(true));
  }, [captchaPassed, captchaToken]);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateSnapshot));
    saveCloudState(stateSnapshot, cloudSessionToken)
      .then((target) => setSyncStatus(target === 'cloud' ? 'Сохранено в Supabase' : 'Сохранено в браузере'))
      .catch(() => setSyncStatus('Supabase недоступен, изменения сохранены в браузере'));
  }, [cloudSessionToken, hydrated, stateSnapshot]);

  useEffect(() => {
    if (!CAPTCHA_SITE_KEY || captchaPassed) return undefined;

    const renderCaptcha = () => {
      if (!window.smartCaptcha || !captchaRef.current || captchaToken) return;
      setCaptchaReady(true);
      window.smartCaptcha.render(captchaRef.current, {
        sitekey: CAPTCHA_SITE_KEY,
        callback: (token) => setCaptchaToken(token),
      });
    };

    const existingScript = document.querySelector('script[data-yandex-smartcaptcha]');
    if (existingScript) {
      renderCaptcha();
      existingScript.addEventListener('load', renderCaptcha);
      return () => existingScript.removeEventListener('load', renderCaptcha);
    }

    const script = document.createElement('script');
    script.src = 'https://smartcaptcha.yandexcloud.net/captcha.js';
    script.async = true;
    script.defer = true;
    script.dataset.yandexSmartcaptcha = 'true';
    script.onload = renderCaptcha;
    script.onerror = () => setCaptchaReady(false);
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [captchaPassed, captchaToken]);

  function passCaptcha() {
    window.sessionStorage.setItem(CAPTCHA_SESSION_KEY, 'true');
    setCaptchaPassed(true);
  }

  function updateStudentField(field, value) {
    setStudentForm((current) => ({ ...current, [field]: value }));
  }

  function addStudent(event) {
    event.preventDefault();
    const name = studentForm.name.trim();
    if (!name) return;

    const student = {
      id: createId('student'),
      ...studentForm,
      name,
      status: 'Активен',
      createdAt: today,
    };

    setStudents((current) => [student, ...current]);
    setStudentForm(emptyStudent);
    setSubscriptionForm((current) => ({ ...current, studentId: student.id }));
    setLessonForm((current) => ({ ...current, studentId: student.id }));
    setActiveTab('students');
  }

  function addSubscription(event) {
    event.preventDefault();
    if (!students.some((student) => student.id === subscriptionForm.studentId)) return;

    const selectedPlan = plans.find((plan) => plan.name === subscriptionForm.planName) || plans[0];
    const start = new Date(subscriptionForm.startDate || today);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const subscription = {
      id: createId('sub'),
      studentId: subscriptionForm.studentId,
      planName: selectedPlan.name,
      totalLessons: selectedPlan.lessons,
      remainingLessons: selectedPlan.lessons,
      price: selectedPlan.price,
      startDate: subscriptionForm.startDate || today,
      endDate: end.toISOString().slice(0, 10),
      status: 'Активен',
    };

    setSubscriptions((current) => [subscription, ...current]);
    setLessonForm((current) => ({ ...current, studentId: subscription.studentId, subscriptionId: subscription.id }));
    setActiveTab('subscriptions');
  }

  function addLesson(event) {
    event.preventDefault();
    if (!students.some((student) => student.id === lessonForm.studentId) || !lessonForm.topic.trim()) return;
    if (lessonForm.subscriptionId && !subscriptions.some((subscription) => subscription.id === lessonForm.subscriptionId && subscription.studentId === lessonForm.studentId)) return;

    const lesson = {
      id: createId('lesson'),
      ...lessonForm,
      topic: lessonForm.topic.trim(),
      status: 'Запланирован',
    };

    setLessons((current) => [lesson, ...current]);
    setLessonForm((current) => ({ ...current, topic: '' }));
    setActiveTab('lessons');
  }

  function completeLesson(lessonId) {
    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson || lesson.status === 'Проведен') return;

    setLessons((current) => current.map((item) => (item.id === lessonId ? { ...item, status: 'Проведен' } : item)));
    if (lesson.subscriptionId) {
      setSubscriptions((current) => current.map((subscription) => {
        if (subscription.id !== lesson.subscriptionId) return subscription;
        const remainingLessons = Math.max(0, subscription.remainingLessons - 1);
        return { ...subscription, remainingLessons, status: remainingLessons === 0 ? 'Завершен' : subscription.status };
      }));
    }
  }

  function removeStudent(studentId) {
    setStudents((current) => current.filter((student) => student.id !== studentId));
    setSubscriptions((current) => current.filter((subscription) => subscription.studentId !== studentId));
    setLessons((current) => current.filter((lesson) => lesson.studentId !== studentId));
  }

  function updateLessonStudent(studentId) {
    const studentSubscriptions = subscriptions.filter((subscription) => subscription.studentId === studentId && subscription.status === 'Активен');
    setLessonForm((current) => ({ ...current, studentId, subscriptionId: studentSubscriptions[0]?.id || '' }));
  }

  if (!captchaPassed) {
    return (
      <main className="captcha-screen">
        <section className="captcha-card" aria-label="Проверка входа">
          <div className="brand-mark">♪</div>
          <p className="eyebrow">Solfejio CRM</p>
          <h1>Музыкальная школа</h1>
          <p>
            Перед входом администратор проходит Яндекс SmartCaptcha. В учебном режиме без ключа доступна демо-проверка,
            чтобы проект запускался сразу после сборки.
          </p>
          {CAPTCHA_SITE_KEY ? (
            <>
              <div className="captcha-widget" ref={captchaRef} />
              {!captchaReady && <p className="muted">Загружаем виджет Яндекс SmartCaptcha...</p>}
              <button className="primary-button" disabled={!captchaToken} onClick={passCaptcha} type="button">
                Войти в систему
              </button>
            </>
          ) : (
            <button className="primary-button" onClick={passCaptcha} type="button">
              Пройти учебную капчу
            </button>
          )}
          <span className="security-note">Ключ капчи подключается через REACT_APP_YANDEX_CAPTCHA_SITEKEY.</span>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="logo-row">
          <div className="brand-mark small">♪</div>
          <div>
            <strong>Solfejio</strong>
            <span>CRM школы музыки</span>
          </div>
        </div>
        <nav>
          {[
            ['dashboard', 'Обзор'],
            ['students', 'Ученики'],
            ['subscriptions', 'Абонементы'],
            ['lessons', 'Занятия'],
          ].map(([tab, label]) => (
            <button className={activeTab === tab ? 'nav-button active' : 'nav-button'} key={tab} onClick={() => setActiveTab(tab)} type="button">
              {label}
            </button>
          ))}
        </nav>
        <div className="sync-card">
          <span>{cloudEnabled ? '☁️ Облако' : '💾 Демо'}</span>
          <p>{syncStatus}</p>
        </div>
      </aside>

      <section className="workspace">
        <header className="hero">
          <div>
            <p className="eyebrow">Админ-панель</p>
            <h1>Музыкальная школа «Solfejio»</h1>
            <p>Ученики, абонементы, расписание и остатки занятий в одном интерфейсе.</p>
          </div>
          <div className="hero-badge">
            <span>{plannedLessons.length}</span>
            ближайших занятия
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <section className="content-grid">
            <article className="stat-card accent">
              <span>Ученики</span>
              <strong>{students.length}</strong>
              <p>{students.filter((student) => student.status === 'Активен').length} активных</p>
            </article>
            <article className="stat-card">
              <span>Абонементы</span>
              <strong>{activeSubscriptions.length}</strong>
              <p>сейчас действуют</p>
            </article>
            <article className="stat-card">
              <span>Выручка</span>
              <strong>{formatMoney(income)}</strong>
              <p>по всем абонементам</p>
            </article>
            <article className="stat-card">
              <span>Проведено</span>
              <strong>{completedLessons.length}</strong>
              <p>занятий отмечено</p>
            </article>

            <article className="panel wide">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Быстрые действия</p>
                  <h2>Добавить ученика</h2>
                </div>
              </div>
              <StudentForm form={studentForm} onChange={updateStudentField} onSubmit={addStudent} />
            </article>

            <article className="panel">
              <h2>Сегодня в фокусе</h2>
              <div className="timeline-list">
                {plannedLessons.slice(0, 4).map((lesson) => (
                  <div className="timeline-item" key={lesson.id}>
                    <span>{lesson.time}</span>
                    <div>
                      <strong>{getStudentName(students, lesson.studentId)}</strong>
                      <p>{lesson.topic}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeTab === 'students' && (
          <section className="content-grid two-columns">
            <article className="panel">
              <h2>Новый ученик</h2>
              <StudentForm form={studentForm} onChange={updateStudentField} onSubmit={addStudent} />
            </article>
            <article className="panel list-panel">
              <h2>База учеников</h2>
              <div className="card-list">
                {students.map((student) => (
                  <div className="student-card" key={student.id}>
                    <div>
                      <strong>{student.name}</strong>
                      <span>{student.instrument} · {student.teacher || 'преподаватель не назначен'}</span>
                      <p>{student.phone} · {student.age || '—'} лет</p>
                      {student.note && <small>{student.note}</small>}
                    </div>
                    <button className="ghost-button danger" onClick={() => removeStudent(student.id)} type="button">Удалить</button>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeTab === 'subscriptions' && (
          <section className="content-grid two-columns">
            <article className="panel">
              <h2>Добавить абонемент</h2>
              <form className="form-stack" onSubmit={addSubscription}>
                <label>
                  Ученик
                  <select value={subscriptionForm.studentId} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, studentId: event.target.value })}>
                    {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                  </select>
                </label>
                <label>
                  Тариф
                  <select value={subscriptionForm.planName} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, planName: event.target.value })}>
                    {plans.map((plan) => <option key={plan.name} value={plan.name}>{plan.name} — {plan.lessons} зан., {formatMoney(plan.price)}</option>)}
                  </select>
                </label>
                <label>
                  Дата начала
                  <input type="date" value={subscriptionForm.startDate} onChange={(event) => setSubscriptionForm({ ...subscriptionForm, startDate: event.target.value })} />
                </label>
                <button className="primary-button" type="submit">Создать абонемент</button>
              </form>
            </article>
            <article className="panel list-panel">
              <h2>Абонементы</h2>
              <div className="card-list">
                {subscriptions.map((subscription) => (
                  <div className="subscription-card" key={subscription.id}>
                    <div>
                      <strong>{subscription.planName}</strong>
                      <span>{getStudentName(students, subscription.studentId)}</span>
                    </div>
                    <div className="progress-line"><i style={{ width: `${(subscription.remainingLessons / subscription.totalLessons) * 100}%` }} /></div>
                    <p>{subscription.remainingLessons} из {subscription.totalLessons} занятий · до {subscription.endDate}</p>
                    <b>{subscription.status}</b>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeTab === 'lessons' && (
          <section className="content-grid two-columns">
            <article className="panel">
              <h2>Запланировать занятие</h2>
              <form className="form-stack" onSubmit={addLesson}>
                <label>
                  Ученик
                  <select value={lessonForm.studentId} onChange={(event) => updateLessonStudent(event.target.value)}>
                    {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
                  </select>
                </label>
                <label>
                  Абонемент
                  <select value={lessonForm.subscriptionId} onChange={(event) => setLessonForm({ ...lessonForm, subscriptionId: event.target.value })}>
                    <option value="">Без абонемента</option>
                    {subscriptions.filter((subscription) => subscription.studentId === lessonForm.studentId).map((subscription) => (
                      <option key={subscription.id} value={subscription.id}>{subscription.planName} · осталось {subscription.remainingLessons}</option>
                    ))}
                  </select>
                </label>
                <div className="inline-fields">
                  <label>
                    Дата
                    <input type="date" value={lessonForm.date} onChange={(event) => setLessonForm({ ...lessonForm, date: event.target.value })} />
                  </label>
                  <label>
                    Время
                    <input type="time" value={lessonForm.time} onChange={(event) => setLessonForm({ ...lessonForm, time: event.target.value })} />
                  </label>
                </div>
                <label>
                  Тема
                  <input placeholder="Например: постановка голоса" value={lessonForm.topic} onChange={(event) => setLessonForm({ ...lessonForm, topic: event.target.value })} />
                </label>
                <button className="primary-button" type="submit">Добавить занятие</button>
              </form>
            </article>
            <article className="panel list-panel">
              <h2>Расписание</h2>
              <div className="card-list">
                {lessons.map((lesson) => (
                  <div className="lesson-card" key={lesson.id}>
                    <time>{lesson.date} · {lesson.time}</time>
                    <strong>{getStudentName(students, lesson.studentId)}</strong>
                    <p>{lesson.topic}</p>
                    <div className="lesson-actions">
                      <span className={lesson.status === 'Проведен' ? 'pill done' : 'pill'}>{lesson.status}</span>
                      {lesson.status !== 'Проведен' && <button className="ghost-button" onClick={() => completeLesson(lesson.id)} type="button">Отметить проведенным</button>}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}
      </section>
    </main>
  );
}

function StudentForm({ form, onChange, onSubmit }) {
  return (
    <form className="form-stack" onSubmit={onSubmit}>
      <label>
        ФИО ученика
        <input placeholder="Например: София Кузнецова" value={form.name} onChange={(event) => onChange('name', event.target.value)} />
      </label>
      <div className="inline-fields">
        <label>
          Возраст
          <input min="3" placeholder="10" type="number" value={form.age} onChange={(event) => onChange('age', event.target.value)} />
        </label>
        <label>
          Телефон
          <input placeholder="+7 ..." value={form.phone} onChange={(event) => onChange('phone', event.target.value)} />
        </label>
      </div>
      <div className="inline-fields">
        <label>
          Инструмент
          <select value={form.instrument} onChange={(event) => onChange('instrument', event.target.value)}>
            <option>Фортепиано</option>
            <option>Гитара</option>
            <option>Вокал</option>
            <option>Скрипка</option>
            <option>Ударные</option>
            <option>Сольфеджио</option>
          </select>
        </label>
        <label>
          Преподаватель
          <input placeholder="Имя педагога" value={form.teacher} onChange={(event) => onChange('teacher', event.target.value)} />
        </label>
      </div>
      <label>
        Заметка
        <textarea placeholder="Цели, особенности расписания, комментарий" value={form.note} onChange={(event) => onChange('note', event.target.value)} />
      </label>
      <button className="primary-button" type="submit">Добавить ученика</button>
    </form>
  );
}

export default App;
