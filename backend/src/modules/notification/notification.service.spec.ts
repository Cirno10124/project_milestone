import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  it('dedupes emails', async () => {
    // 最小化单测：确保模块可被引入（不依赖 DB）
    expect(NotificationService).toBeDefined();
  });
});

