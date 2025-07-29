import { Logger } from '../logger';

describe('Logger', () => {
  let logger: Logger;
  let spyError: jest.SpyInstance;
  let spyWarn: jest.SpyInstance;
  let spyLog: jest.SpyInstance;

  beforeEach(() => {
    spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
    spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    spyLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger = new Logger(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs error', () => {
    logger.error('err', { foo: 1 });
    expect(spyError).toHaveBeenCalledWith(expect.stringContaining('err'));
  });

  it('logs warn', () => {
    logger.warn('warn', { foo: 2 });
    expect(spyWarn).toHaveBeenCalledWith(expect.stringContaining('warn'));
  });

  it('logs info', () => {
    logger.info('info', { foo: 3 });
    expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('info'));
  });

  it('logs debug', () => {
    logger.debug('debug', { foo: 4 });
    expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('debug'));
  });

  it('withPrefix adds prefix', () => {
    const child = logger.withPrefix('PREF');
    child.info('msg');
    expect(spyLog).toHaveBeenCalledWith(expect.stringContaining('[PREF] msg'));
  });

  it('setLevel and isLevelEnabled work', () => {
    logger.setLevel('ERROR');
    expect(logger.isLevelEnabled('ERROR')).toBe(true);
    expect(logger.isLevelEnabled('DEBUG')).toBe(false);
  });
});
