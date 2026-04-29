import React, { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import {
    AppRoot,
    View,
    Panel,
    PanelHeader,
    Group,
    Cell,
    Button,
    Div,
    ScreenSpinner,
    Epic,
    Tabbar,
    TabbarItem,
    SimpleCell,
    Avatar,
    Header,
    Spacing,
    CardGrid,
    Card,
    Counter,
    Alert,
    FormItem,
    Input,
    ModalPage,
    ModalPageHeader,
    ModalRoot,
    FormLayoutGroup,
    Select,
    PanelHeaderButton
} from '@vkontakte/vkui';
import { 
    Icon28UsersOutline, 
    Icon28NewsfeedOutline, 
    Icon28AddOutline,
    Icon28UserOutline,
    Icon28MusicOutline,
    Icon28CancelOutline
} from '@vkontakte/icons';
import '@vkontakte/vkui/dist/vkui.css';

// Типы услуг студии
const SERVICE_TYPES = [
    { value: 'recording', label: '🎙️ Запись вокала', price: 1500, color: '#4BB34B' },
    { value: 'mixing', label: '🎚️ Сведение', price: 5000, color: '#4B8EF5' },
    { value: 'mastering', label: '✨ Мастеринг', price: 3000, color: '#FF9F43' },
    { value: 'rehearsal', label: '🥁 Репетиция', price: 800, color: '#A29BFE' },
    { value: 'instrumental', label: '🎸 Инструментал', price: 2000, color: '#E84393' },
    { value: 'consultation', label: '💡 Консультация', price: 1000, color: '#00B894' }
];

function App() {
    // Авторизация
    const [isAuth, setIsAuth] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    
    // Данные CRM
    const [activeTab, setActiveTab] = useState('dashboard');
    const [modal, setModal] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmData, setConfirmData] = useState(null);
    const [clients, setClients] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({
        totalClients: 0,
        activeBookings: 0,
        totalRevenue: 0,
        completedBookings: 0
    });

    // Авторизация через VK
    useEffect(() => {
        const initAuth = async () => {
            try {
                console.log('Инициализация VK Bridge...');
                await bridge.send('VKWebAppInit');
                
                console.log('Получение данных пользователя...');
                const userData = await bridge.send('VKWebAppGetUserInfo');
                
                console.log('Авторизация успешна:', userData.first_name);
                setUser(userData);
                await loadCRMData(userData.id);
                setIsAuth(true);
            } catch (error) {
                console.error('Ошибка авторизации:', error);
                setAuthError('Не удалось авторизоваться. Попробуйте перезапустить приложение.');
            } finally {
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);

    // Загрузка данных
    const loadCRMData = async (userId) => {
        try {
            const storageData = await bridge.send('VKWebAppStorageGet', {
                keys: [`crm_clients_${userId}`, `crm_bookings_${userId}`]
            });

            const clientsItem = storageData.keys.find(k => k.key === `crm_clients_${userId}`);
            if (clientsItem && clientsItem.value) {
                setClients(JSON.parse(clientsItem.value));
            } else {
                const initialClients = [
                    { id: 1, name: 'Иван Иванов', phone: '+7 999 123-45-67', email: 'ivan@example.com', totalSpent: 15000, lastVisit: new Date().toISOString() },
                    { id: 2, name: 'Анна Петрова', phone: '+7 999 234-56-78', email: 'anna@example.com', totalSpent: 8000, lastVisit: new Date().toISOString() },
                    { id: 3, name: 'Максим Сидоров', phone: '+7 999 345-67-89', email: 'max@example.com', totalSpent: 25000, lastVisit: new Date().toISOString() }
                ];
                setClients(initialClients);
                await bridge.send('VKWebAppStorageSet', { 
                    key: `crm_clients_${userId}`, 
                    value: JSON.stringify(initialClients) 
                });
            }

            const bookingsItem = storageData.keys.find(k => k.key === `crm_bookings_${userId}`);
            if (bookingsItem && bookingsItem.value) {
                setBookings(JSON.parse(bookingsItem.value));
            } else {
                const initialBookings = [
                    { id: 1, clientId: 1, clientName: 'Иван Иванов', service: 'recording', serviceLabel: 'Запись вокала', price: 1500, date: new Date().toISOString(), status: 'completed', duration: 3 },
                    { id: 2, clientId: 2, clientName: 'Анна Петрова', service: 'mixing', serviceLabel: 'Сведение', price: 5000, date: new Date().toISOString(), status: 'active', duration: 2 },
                    { id: 3, clientId: 3, clientName: 'Максим Сидоров', service: 'mastering', serviceLabel: 'Мастеринг', price: 3000, date: new Date().toISOString(), status: 'active', duration: 1 }
                ];
                setBookings(initialBookings);
                await bridge.send('VKWebAppStorageSet', { 
                    key: `crm_bookings_${userId}`, 
                    value: JSON.stringify(initialBookings) 
                });
            }
        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
        }
    };

    // Сохранение клиентов
    useEffect(() => {
        if (isAuth && user && clients.length > 0) {
            bridge.send('VKWebAppStorageSet', { 
                key: `crm_clients_${user.id}`, 
                value: JSON.stringify(clients) 
            }).catch(console.error);
        }
    }, [clients, isAuth, user]);

    // Сохранение бронирований
    useEffect(() => {
        if (isAuth && user && bookings.length > 0) {
            bridge.send('VKWebAppStorageSet', { 
                key: `crm_bookings_${user.id}`, 
                value: JSON.stringify(bookings) 
            }).catch(console.error);
        }
    }, [bookings, isAuth, user]);

    // Обновление статистики
    useEffect(() => {
        const totalClients = clients.length;
        const activeBookings = bookings.filter(b => b.status === 'active').length;
        const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0);
        const completedBookings = bookings.filter(b => b.status === 'completed').length;
        setStats({ totalClients, activeBookings, totalRevenue, completedBookings });
    }, [clients, bookings]);

    // Добавление клиента
    const addClient = (name, phone, email) => {
        const newClient = {
            id: Date.now(),
            name,
            phone,
            email,
            totalSpent: 0,
            lastVisit: new Date().toISOString()
        };
        setClients(prev => [newClient, ...prev]);
        setModal(null);
    };

    // Добавление бронирования
    const addBooking = (clientId, clientName, service, price, duration) => {
        const serviceInfo = SERVICE_TYPES.find(s => s.value === service);
        const newBooking = {
            id: Date.now(),
            clientId,
            clientName,
            service,
            serviceLabel: serviceInfo?.label || service,
            price: price,
            date: new Date().toISOString(),
            status: 'active',
            duration: duration || 1
        };
        setBookings(prev => [newBooking, ...prev]);
        
        setClients(prev => prev.map(c => 
            c.id === clientId 
                ? { ...c, totalSpent: c.totalSpent + price, lastVisit: new Date().toISOString() }
                : c
        ));
        
        setModal(null);
    };

    // Завершение бронирования
    const completeBooking = (bookingId) => {
        setBookings(prev => prev.map(b => 
            b.id === bookingId ? { ...b, status: 'completed' } : b
        ));
        setShowConfirm(false);
    };

    // Выход
    const handleLogout = () => {
        setUser(null);
        setIsAuth(false);
        setClients([]);
        setBookings([]);
    };

    // Модальные окна
    const AddClientModal = () => {
        const [name, setName] = useState('');
        const [phone, setPhone] = useState('');
        const [email, setEmail] = useState('');

        return (
            <ModalPage id="addClient" onClose={() => setModal(null)}>
                <ModalPageHeader>➕ Новый клиент</ModalPageHeader>
                <FormLayoutGroup>
                    <FormItem top="Имя клиента">
                        <Input placeholder="Иван Иванов" value={name} onChange={e => setName(e.target.value)} />
                    </FormItem>
                    <FormItem top="Телефон">
                        <Input placeholder="+7 999 123-45-67" value={phone} onChange={e => setPhone(e.target.value)} />
                    </FormItem>
                    <FormItem top="Email">
                        <Input placeholder="ivan@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </FormItem>
                    <Button size="l" stretched onClick={() => {
                        if (name && phone) {
                            addClient(name, phone, email);
                        } else {
                            alert('Заполните имя и телефон!');
                        }
                    }}>Добавить клиента</Button>
                </FormLayoutGroup>
            </ModalPage>
        );
    };

    const AddBookingModal = () => {
        const [selectedClientId, setSelectedClientId] = useState('');
        const [selectedService, setSelectedService] = useState('recording');
        const [duration, setDuration] = useState(1);
        
        const selectedClient = clients.find(c => c.id === parseInt(selectedClientId));
        const serviceInfo = SERVICE_TYPES.find(s => s.value === selectedService);

        return (
            <ModalPage id="addBooking" onClose={() => setModal(null)}>
                <ModalPageHeader>🎵 Новая запись</ModalPageHeader>
                <FormLayoutGroup>
                    <FormItem top="Клиент">
                        <Select
                            value={selectedClientId}
                            onChange={e => setSelectedClientId(e.target.value)}
                            options={[
                                { label: 'Выберите клиента', value: '' },
                                ...clients.map(c => ({ label: c.name, value: c.id.toString() }))
                            ]}
                        />
                    </FormItem>
                    <FormItem top="Услуга">
                        <Select
                            value={selectedService}
                            onChange={e => setSelectedService(e.target.value)}
                            options={SERVICE_TYPES.map(s => ({ label: s.label, value: s.value }))}
                        />
                    </FormItem>
                    <FormItem top="Длительность (часы)">
                        <Input type="number" min="1" max="8" value={duration} onChange={e => setDuration(parseInt(e.target.value))} />
                    </FormItem>
                    {serviceInfo && (
                        <FormItem top="Стоимость">
                            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#4BB34B' }}>
                                {serviceInfo.price * duration} ₽
                            </div>
                        </FormItem>
                    )}
                    <Button size="l" stretched onClick={() => {
                        if (selectedClientId && selectedService) {
                            addBooking(
                                parseInt(selectedClientId),
                                selectedClient?.name,
                                selectedService,
                                serviceInfo.price * duration,
                                duration
                            );
                        } else {
                            alert('Выберите клиента и услугу!');
                        }
                    }}>Создать запись</Button>
                </FormLayoutGroup>
            </ModalPage>
        );
    };

    const modalRoot = (
        <ModalRoot activeModal={modal}>
            <AddClientModal />
            <AddBookingModal />
        </ModalRoot>
    );

    // Экран загрузки
    if (isLoading) {
        return (
            <AppRoot>
                <View activePanel="loading">
                    <Panel id="loading">
                        <ScreenSpinner />
                    </Panel>
                </View>
            </AppRoot>
        );
    }

    // Экран ошибки
    if (authError) {
        return (
            <AppRoot>
                <View activePanel="error">
                    <Panel id="error">
                        <Group>
                            <Div style={{ textAlign: 'center', padding: 40 }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                                <Header size="large">Ошибка</Header>
                                <div style={{ marginBottom: 24 }}>{authError}</div>
                                <Button onClick={() => window.location.reload()}>Повторить</Button>
                            </Div>
                        </Group>
                    </Panel>
                </View>
            </AppRoot>
        );
    }

    // Экран входа
    if (!isAuth) {
        return (
            <AppRoot>
                <View activePanel="welcome">
                    <Panel id="welcome">
                        <Group style={{ marginTop: 40 }}>
                            <Div style={{ textAlign: 'center' }}>
                                <Avatar size={96} style={{ marginBottom: 20, background: '#6C5CE7' }}>
                                    <Icon28MusicOutline width={48} height={48} fill="white" />
                                </Avatar>
                                <Header size="large">Music Studio CRM</Header>
                                <Spacing size={20} />
                                <div style={{ color: '#6c7a91', marginBottom: 32 }}>
                                    Управляйте музыкальной студией<br />прямо в VK
                                </div>
                                <Button size="l" stretched onClick={() => window.location.reload()} style={{ background: '#0077ff', maxWidth: 300, margin: '0 auto' }}>
                                    Войти через VK
                                </Button>
                            </Div>
                        </Group>
                    </Panel>
                </View>
            </AppRoot>
        );
    }

    return (
        <AppRoot>
            {modalRoot}
            
            <Epic activeStory={activeTab} tabbar={
                <Tabbar>
                    <TabbarItem onClick={() => setActiveTab('dashboard')} selected={activeTab === 'dashboard'}>
                        <Icon28MusicOutline />
                    </TabbarItem>
                    <TabbarItem onClick={() => setActiveTab('clients')} selected={activeTab === 'clients'}>
                        <Icon28UsersOutline />
                        <Counter size="s" mode="prominent">{clients.length}</Counter>
                    </TabbarItem>
                    <TabbarItem onClick={() => setActiveTab('bookings')} selected={activeTab === 'bookings'}>
                        <Icon28NewsfeedOutline />
                        <Counter size="s" mode="prominent">{bookings.filter(b => b.status === 'active').length}</Counter>
                    </TabbarItem>
                    <TabbarItem onClick={() => setActiveTab('profile')} selected={activeTab === 'profile'}>
                        <Icon28UserOutline />
                    </TabbarItem>
                </Tabbar>
            }>
                {/* Дашборд */}
                <View id="dashboard" activePanel="dashboard">
                    <Panel id="dashboard">
                        <PanelHeader>Music CRM</PanelHeader>
                        
                        <Group style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)', margin: 16, borderRadius: 24 }}>
                            <Div style={{ color: 'white', textAlign: 'center', padding: 24 }}>
                                <div style={{ fontSize: 14, opacity: 0.8 }}>Добро пожаловать, {user?.first_name}!</div>
                                <div style={{ fontSize: 28, fontWeight: 'bold' }}>Ваша студия</div>
                            </Div>
                        </Group>

                        <Group header={<Header mode="secondary">📊 Статистика</Header>}>
                            <Div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1, textAlign: 'center', padding: 12, background: '#f0f2f5', borderRadius: 16 }}>
                                    <div style={{ fontSize: 24 }}>👥</div>
                                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#4BB34B' }}>{stats.totalClients}</div>
                                    <div style={{ fontSize: 12, color: '#6c7a91' }}>Клиентов</div>
                                </div>
                                <div style={{ flex: 1, textAlign: 'center', padding: 12, background: '#f0f2f5', borderRadius: 16 }}>
                                    <div style={{ fontSize: 24 }}>🎵</div>
                                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#FF9F43' }}>{stats.activeBookings}</div>
                                    <div style={{ fontSize: 12, color: '#6c7a91' }}>Активных</div>
                                </div>
                                <div style={{ flex: 1, textAlign: 'center', padding: 12, background: '#f0f2f5', borderRadius: 16 }}>
                                    <div style={{ fontSize: 24 }}>💰</div>
                                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#6C5CE7' }}>{stats.totalRevenue.toLocaleString()} ₽</div>
                                    <div style={{ fontSize: 12, color: '#6c7a91' }}>Выручка</div>
                                </div>
                            </Div>
                        </Group>

                        <Group header={<Header mode="secondary">⚡ Быстрые действия</Header>}>
                            <CardGrid size="l">
                                <Card mode="shadow">
                                    <Div style={{ textAlign: 'center', padding: 16 }}>
                                        <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
                                        <div style={{ fontWeight: 500 }}>Новый клиент</div>
                                        <Button size="m" stretched style={{ marginTop: 12, background: '#4BB34B' }} onClick={() => setModal('addClient')}>
                                            Добавить
                                        </Button>
                                    </Div>
                                </Card>
                                <Card mode="shadow">
                                    <Div style={{ textAlign: 'center', padding: 16 }}>
                                        <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
                                        <div style={{ fontWeight: 500 }}>Новая запись</div>
                                        <Button size="m" stretched style={{ marginTop: 12, background: '#4B8EF5' }} onClick={() => setModal('addBooking')}>
                                            Создать
                                        </Button>
                                    </Div>
                                </Card>
                            </CardGrid>
                        </Group>

                        <Group header={<Header mode="secondary">📈 Услуги</Header>}>
                            {SERVICE_TYPES.map(service => (
                                <SimpleCell 
                                    key={service.value}
                                    before={<div style={{ fontSize: 24 }}>{service.label.charAt(0)}</div>}
                                    after={<span style={{ color: service.color, fontWeight: 'bold' }}>{service.price} ₽/час</span>}
                                >
                                    {service.label}
                                </SimpleCell>
                            ))}
                        </Group>
                    </Panel>
                </View>

                {/* Клиенты */}
                <View id="clients" activePanel="clients">
                    <Panel id="clients">
                        <PanelHeader>
                            Клиенты
                            <PanelHeaderButton onClick={() => setModal('addClient')}>
                                <Icon28AddOutline />
                            </PanelHeaderButton>
                        </PanelHeader>
                        <Group>
                            {clients.map(client => (
                                <Cell
                                    key={client.id}
                                    before={<Avatar size={40}>{client.name.charAt(0)}</Avatar>}
                                    subtitle={`${client.phone} • Всего: ${client.totalSpent.toLocaleString()} ₽`}
                                    after={<Button size="s" mode="secondary" onClick={() => setModal('addBooking')}>Записать</Button>}
                                >
                                    {client.name}
                                </Cell>
                            ))}
                        </Group>
                    </Panel>
                </View>

                {/* Записи */}
                <View id="bookings" activePanel="bookings">
                    <Panel id="bookings">
                        <PanelHeader>
                            Записи
                            <PanelHeaderButton onClick={() => setModal('addBooking')}>
                                <Icon28AddOutline />
                            </PanelHeaderButton>
                        </PanelHeader>
                        <Group>
                            {bookings.map(booking => (
                                <Cell
                                    key={booking.id}
                                    before={booking.status === 'active' ? '🎙️' : '✅'}
                                    subtitle={`${new Date(booking.date).toLocaleDateString('ru-RU')} • ${booking.duration} ч • ${booking.price} ₽`}
                                    after={
                                        booking.status === 'active' ? (
                                            <Button size="s" mode="secondary" onClick={() => {
                                                setConfirmData(booking);
                                                setShowConfirm(true);
                                            }}>Завершить</Button>
                                        ) : (
                                            <span style={{ color: '#4BB34B' }}>Выполнено</span>
                                        )
                                    }
                                >
                                    {booking.clientName} — {booking.serviceLabel}
                                </Cell>
                            ))}
                        </Group>
                    </Panel>
                </View>

                {/* Профиль */}
                <View id="profile" activePanel="profile">
                    <Panel id="profile">
                        <PanelHeader>Профиль</PanelHeader>
                        <Group>
                            <Cell before={<Avatar src={user?.photo_100} size={48} />}>
                                {user?.first_name} {user?.last_name}
                            </Cell>
                        </Group>
                        
                        <Group header={<Header mode="secondary">Итоги</Header>}>
                            <SimpleCell subtitle="Всего клиентов" after={stats.totalClients}>👥 Клиентов</SimpleCell>
                            <SimpleCell subtitle="Активных записей" after={stats.activeBookings}>🎵 Записей</SimpleCell>
                            <SimpleCell subtitle="Выручка" after={`${stats.totalRevenue.toLocaleString()} ₽`}>💰 Выручка</SimpleCell>
                        </Group>

                        <Group header={<Header mode="secondary">Настройки</Header>}>
                            <Cell before={<Icon28CancelOutline />} onClick={handleLogout} style={{ color: '#E64646' }}>
                                Выйти
                            </Cell>
                        </Group>

                        <Group>
                            <Div style={{ textAlign: 'center', color: '#6c7a91', fontSize: 12, padding: 20 }}>
                                Music Studio CRM v1.0
                            </Div>
                        </Group>
                    </Panel>
                </View>
            </Epic>

            {showConfirm && (
                <Alert
                    actions={[
                        { title: 'Отмена', mode: 'cancel', action: () => setShowConfirm(false) },
                        { title: 'Завершить', mode: 'default', action: () => completeBooking(confirmData.id) }
                    ]}
                    onClose={() => setShowConfirm(false)}
                >
                                    <h2>Завершить запись?</h2>
                    <p>Отметить запись "{confirmData?.clientName} — {confirmData?.serviceLabel}" как выполненную?</p>
                </Alert>
            )}
        </AppRoot>
    );
}

export default App;