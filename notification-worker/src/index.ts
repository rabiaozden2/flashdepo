import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';
import { DataSource, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

dotenv.config();

@Entity()
export class NotificationLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    type: string;

    @Column('jsonb')
    payload: any;

    @Column({ default: 'sent' })
    status: string;

    @CreateDateColumn()
    created_at: Date;
}

const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgres://root:secretpassword@localhost:5432/flashdepo?sslmode=disable',
    synchronize: true, // Auto create tables
    entities: [NotificationLog],
});

const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null
});

async function main() {
    await AppDataSource.initialize();
    console.log("Notification Worker DB Connected");

    const worker = new Worker('notifications', async (job: Job) => {
        console.log(`Processing notification job: ${job.name}`);
        const data = job.data;

        let notificationType = '';
        if (job.name === 'order_success') {
            notificationType = 'email_success';
            console.log(`[EMAIL MOCK] Sending SUCCESS email to user ${data.user_id} for order ${data.order_id}`);
        } else if (job.name === 'order_failed') {
            notificationType = 'email_failed';
            console.log(`[EMAIL MOCK] Sending FAILURE email to user ${data.user_id} for order ${data.order_id}`);
        }

        // Save to DB
        const log = new NotificationLog();
        log.type = notificationType;
        log.payload = data;
        await AppDataSource.manager.save(log);

    }, { connection });

    worker.on('completed', job => {
        console.log(`Job ${job.id} has completed!`);
    });

    worker.on('failed', (job, err) => {
        console.log(`Job ${job?.id} has failed with ${err.message}`);
    });

    process.on('SIGTERM', async () => {
        console.log('SIGTERM received. Shutting down gracefully...');
        await worker.close();
        process.exit(0);
    });
}

main().catch(err => console.error(err));
