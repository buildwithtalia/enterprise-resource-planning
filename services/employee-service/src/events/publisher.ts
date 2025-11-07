import amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

interface BaseEvent {
  eventId: string;
  eventType: string;
  eventVersion: string;
  timestamp: string;
  source: string;
  data: any;
  metadata: {
    correlationId: string;
    causationId: string;
    userId: string;
    userEmail: string;
  };
}

export class EventPublisher {
  private connection: any = null;
  private channel: any = null;
  private readonly exchangeName = 'employee.events';

  async connect(): Promise<void> {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Declare exchange
      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true,
      });

      logger.info('Event publisher connected to RabbitMQ');
    } catch (error) {
      logger.error('Failed to connect event publisher', error as Error);
      throw error;
    }
  }

  async publish(routingKey: string, event: Partial<BaseEvent>): Promise<void> {
    if (!this.channel) {
      throw new Error('Event publisher not connected');
    }

    const fullEvent: BaseEvent = {
      eventId: event.eventId || `evt-${uuidv4()}`,
      eventType: event.eventType || '',
      eventVersion: event.eventVersion || '1.0',
      timestamp: event.timestamp || new Date().toISOString(),
      source: 'employee-service',
      data: event.data || {},
      metadata: event.metadata || {
        correlationId: `corr-${uuidv4()}`,
        causationId: `cause-${uuidv4()}`,
        userId: 'system',
        userEmail: 'system@company.com',
      },
    };

    try {
      const message = Buffer.from(JSON.stringify(fullEvent));
      this.channel.publish(this.exchangeName, routingKey, message, {
        persistent: true,
        contentType: 'application/json',
      });

      logger.info(`Event published: ${routingKey}`, {
        eventId: fullEvent.eventId,
        eventType: fullEvent.eventType,
      });
    } catch (error) {
      logger.error('Failed to publish event', error as Error);
      throw error;
    }
  }

  async publishEmployeeCreated(data: any, userId: string, userEmail: string): Promise<void> {
    await this.publish('employee.created', {
      eventType: 'EmployeeCreated',
      data,
      metadata: {
        correlationId: `corr-${uuidv4()}`,
        causationId: `cause-${uuidv4()}`,
        userId,
        userEmail,
      },
    });
  }

  async publishEmployeeUpdated(data: any, userId: string, userEmail: string): Promise<void> {
    await this.publish('employee.updated', {
      eventType: 'EmployeeUpdated',
      data,
      metadata: {
        correlationId: `corr-${uuidv4()}`,
        causationId: `cause-${uuidv4()}`,
        userId,
        userEmail,
      },
    });
  }

  async publishEmployeeTerminated(data: any, userId: string, userEmail: string): Promise<void> {
    await this.publish('employee.terminated', {
      eventType: 'EmployeeTerminated',
      data,
      metadata: {
        correlationId: `corr-${uuidv4()}`,
        causationId: `cause-${uuidv4()}`,
        userId,
        userEmail,
      },
    });
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info('Event publisher disconnected');
    } catch (error) {
      logger.error('Error closing event publisher', error as Error);
    }
  }
}
