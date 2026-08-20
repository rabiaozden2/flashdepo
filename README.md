# FlashDepo ⚡ — Dağıtık Depo Flash Sale Sistemi

FlashDepo, ani trafik patlamaları (flash sale / flaş indirim) sırasında yüksek eşzamanlılık (high-concurrency) altında dağıtık depolardaki stokları tutarlı ve güvenli şekilde yöneten, **race-condition** risklerini engelleyen ve asenkron mikroservis mimarisine dayanan uçtan uca bir e-ticaret platformudur.

---

## 📑 İçindekiler
- [Mimari Diyagram](#-mimari-diyagram)
- [Teknoloji Stack'i](#-teknoloji-stacki)
- [Temel Özellikler](#-temel-özellikler)
- [Mimari Detayları](#-mimari-detayları)
- [Docker Servisleri](#-docker-servisleri)
- [Kurulum ve Çalıştırma](#-kurulum-ve-çalıştırma)
- [Test Hesapları](#-test-hesapları)
- [API Endpoint'leri](#-api-endpointleri)

---

## 🏛 Mimari Diyagram

```text
+-----------------------------------------------------------------------------+
|                            Next.js 16 Frontend                              |
|                       (Chakra UI + Redux + Saga)                            |
+------------------------------------+----------------------------------------+
                                     |
                 HTTP / REST         |        WebSocket (/api/ws)
                                     v
+-----------------------------------------------------------------------------+
|                            Go API (Gin Engine)                              |
|   - JWT Doğrulama (RBAC)                                                    |
|   - Atomik Stok Kontrolü (Redis DecrBy)                                     |
|   - Sipariş Kuyruklama (Redis LPush)                                        |
|   - Canlı Stok Yayını (WebSocket Broadcast)                                 |
+-------------------+-----------------------------------+---------------------+
                    |                                   |
     Sipariş Kuyruğu| (process_queue)         Canlı Stok| Sayaçları
                    v                                   v
+-----------------------------------+   +-------------------------------------+
|      Go Order Process Worker      |   |            Redis 7 Servisi          |
|  - BRPOP process_queue            |   | - Atomik stok yönetimi (DECRBY)     |
|  - DB Transaction (PostgreSQL)    |   | - process_queue (Sipariş kuyruğu)   |
|  - BullMQ Bildirim Kuyruğu        |   | - bull:notifications:wait           |
+-------------------+---------------+   +------------------+------------------+
                    |                                      ^
                    | İş Tamamlama                         | Kuyruk İzleme
                    v                                      v
+-----------------------------------+   +-------------------------------------+
|   Node.js Notification Worker     |   |            Go Autoscaler            |
|   (TypeScript + BullMQ + TypeORM) |   | - process_queue uzunluğunu izler    |
|   - E-posta simülasyonu           |   | - Yoğunluğa göre replika ölçekler   |
+-------------------+---------------+   +-------------------------------------+
                    |
                    +--------------------+
                                         |
                                         v
                       +-------------------------------------+
                       |        PostgreSQL 15 Veritabanı     |
                       | - users, warehouses, products       |
                       | - campaigns, orders, notifications  |
                       +-------------------------------------+
```

---

## 🛠 Teknoloji Stack'i

| Katman | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Backend API** | Go 1.21+ / Gin | Gin Web Framework, GORM, Gorilla WebSocket, golang-jwt |
| **Önbellek & Mesajlaşma** | Redis 7 | Atomik stok sayaçları (`DECRBY`/`INCRBY`), List Queue, BullMQ |
| **Veritabanı** | PostgreSQL 15 | İlişkisel veri modeli, SQL migrasyonları |
| **Asenkron Worker** | Go Worker & Node.js | Go sipariş worker'ı, Node.js TypeScript BullMQ bildirim worker'ı |
| **Frontend** | Next.js 16 (App Router) | React 19, Chakra UI v3, Redux Toolkit, Redux-Saga |
| **Konteynerizasyon** | Docker & Docker Compose | Çoklu servis mimarisinin orkestrasyonu |

---

## ✨ Temel Özellikler

- ⚡ **Atomik Stok Rezervasyonu & Aşırı Satış Koruması**: Redis'in atomik `DECRBY` mekanizması sayesinde yüzlerce eşzamanlı istekte dahi stok altına düşülmez.
- 🔄 **Asenkron & Event-Driven Sipariş Akışı**: API siparişi anında `202 Accepted` ile kabul eder, işleme yükünü arka plandaki Go worker'lara devreder.
- 📡 **Gerçek Zamanlı WebSocket Stok Senkronizasyonu**: Herhangi bir müşteri satın alma gerçekleştirdiğinde kalan stok tüm bağlı tarayıcılara WebSocket ile iletilir.
- 🔔 **Dağıtık Bildirim Servisi (BullMQ)**: Başarılı veya başarısız siparişler için ayrık Node.js worker'ları bildirim loglaması yapar.
- 📈 **Dinamik Autoscaler**: Kuyruk derinliğine göre worker kapasitesini izleyen ve ölçekleyen Go servisi.
- 🔐 **Rol Tabanlı Erişim Kontrolü (RBAC)**: `admin`, `warehouse_manager` ve `customer` rolleri ile JWT tabanlı kimlik doğrulama.
- 🏢 **Çoklu Depo Desteği**: İstanbul ve Ankara depoları bazında ürün ve stok yönetimi.
- 💅 **Modern Premium Arayüz**: Glassmorphism, canlı animasyonlar, geri sayım sayacı, anlık stok takibi.

---

## 🧩 Mimari Detayları

1. **Flash Sale Sipariş Akışı**:
   - Müşteri `POST /api/orders` isteği gönderir.
   - API, Redis üzerindeki `stock:<product_id>` anahtarını atomik olarak azaltır (`DECRBY`).
   - Stok yetersizse (`remaining < 0`), işlem geri alınır (`INCRBY`) ve `409 Conflict (Out of stock)` döner.
   - Stok yeterliyse veritabanına `pending` durumunda sipariş kaydı atılır ve Redis `process_queue` kuyruğuna yazılır.
   - API, istemciye `202 Accepted` döner ve WebSocket ile yeni stok bilgisini yayınlar.

2. **Go Order Worker**:
   - `BRPOP process_queue` ile kuyruktan siparişleri alır.
   - PostgreSQL transaction'ı açarak ürünün kalıcı stok miktarını düşürür ve siparişi `completed` durumuna getirir.
   - İşlem sonucunu BullMQ formatında `bull:notifications:wait` kuyruğuna aktarır.

3. **WebSocket Canlı Stok**:
   - Frontend ilk açılışta `ws://localhost:8080/api/ws` adresine bağlanır.
   - Stok değiştiğinde sunucu `{ "type": "STOCK_UPDATE", "campaignId": "...", "stock": 42 }` mesajı yayınlar ve Redux store anlık güncellenir.

---

## 🐳 Docker Servisleri

| Servis | Port | Görev |
| :--- | :--- | :--- |
| `postgres` | `15432:5432` | Ana ilişkisel veritabanı |
| `redis` | `6379:6379` | In-memory önbellek, atomik sayaçlar ve kuyruk |
| `api` | `8080:8080` | Go Gin REST & WebSocket API |
| `worker` | - | Asenkron sipariş işleme Go worker'ı (2 replika) |
| `notification-worker` | - | Node.js TypeScript BullMQ bildirim worker'ı (2 replika) |
| `autoscaler` | - | Redis kuyruk metriklerine göre autoscaling servisi |
| `frontend` | `3000:3000` | Next.js 16 Web arayüzü |

---

## 🚀 Kurulum ve Çalıştırma

### 1. Ön Gereksinimler
- [Docker Desktop](https://www.docker.com/) (v20+)
- [Go](https://go.dev/) (v1.21+) — seed için
- [Node.js](https://nodejs.org/) (v22+) — frontend geliştirme için

### 2. Projeyi Klonlayın
```bash
git clone https://github.com/rabiaozden2/flashdepo.git
cd flashdepo
```

### 3. Docker Servislerini Başlatın
```bash
docker-compose up -d --build
```

### 4. Seed Verilerini Yükleyin
```bash
# Host makineden (15432 ve 6379 portları üzerinden bağlanır)
cd backend && go run cmd/seed/main.go
```

### 5. Uygulamayı Açın
- **Web Arayüzü:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8080](http://localhost:8080)
- **Health Check:** [http://localhost:8080/health](http://localhost:8080/health)

---

## 👥 Test Hesapları

| Rol | E-posta | Şifre |
| :--- | :--- | :--- |
| **Admin** | `admin@flashdepo.com` | `admin123` |
| **Depo Müdürü 1** | `manager1@flashdepo.com` | `manager123` |
| **Depo Müdürü 2** | `manager2@flashdepo.com` | `manager123` |
| **Müşteri** | `customer@flashdepo.com` | `customer123` |

---

## 📡 API Endpoint'leri

| Metot | Endpoint | Açıklama | Yetki |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Sağlık kontrolü | Public |
| `POST` | `/api/auth/register` | Kullanıcı kaydı | Public |
| `POST` | `/api/auth/login` | Giriş & JWT token | Public |
| `GET` | `/api/campaigns` | Aktif kampanyaları listele | Public |
| `POST` | `/api/campaigns` | Kampanya oluştur | Admin |
| `PUT` | `/api/campaigns/:id` | Kampanya güncelle | Admin |
| `DELETE` | `/api/campaigns/:id` | Kampanya sil | Admin |
| `GET` | `/api/products` | Ürünleri listele | Public |
| `POST` | `/api/products` | Ürün ekle | Manager/Admin |
| `GET` | `/api/warehouses` | Depoları listele | Public |
| `GET` | `/api/users` | Kullanıcıları listele | Admin |
| `POST` | `/api/orders` | Sipariş ver (atomik stok) | Customer JWT |
| `GET` | `/api/orders` | Sipariş geçmişi | Customer JWT |
| `GET` | `/api/ws` | WebSocket canlı stok | Public |

---

## 📄 Lisans
Bu proje MIT lisansı altında açık kaynaklıdır.
