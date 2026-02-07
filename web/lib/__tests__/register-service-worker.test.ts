describe('registerServiceWorker', () => {
  const originalNodeEnv = process.env.NODE_ENV
  let registerMock: jest.Mock

  async function freshModule() {
    jest.resetModules()
    return await import('@/lib/pwa/register-service-worker')
  }

  beforeEach(() => {
    registerMock = jest.fn().mockResolvedValue({} as ServiceWorkerRegistration)
    const sw = { register: registerMock } as unknown as ServiceWorkerContainer

    Object.defineProperty(navigator, 'serviceWorker', {
      value: sw,
      configurable: true,
    })
  })

  afterAll(() => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv
  })

  it('registers /sw.js with scope / when enabled', async () => {
    const { registerServiceWorker } = await freshModule()
    await registerServiceWorker({ enabled: true, location: { protocol: 'https:', hostname: 'example.com' } })
    expect(registerMock).toHaveBeenCalledWith('/sw.js', { scope: '/' })
  })

  it('does nothing when service workers are not supported', async () => {
    const { registerServiceWorker } = await freshModule()
    delete (navigator as unknown as Record<string, unknown>).serviceWorker
    await expect(
      registerServiceWorker({ enabled: true, location: { protocol: 'https:', hostname: 'example.com' } })
    ).resolves.toBeUndefined()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('does nothing on insecure origins (non-localhost HTTP)', async () => {
    const { registerServiceWorker } = await freshModule()
    await registerServiceWorker({ enabled: true, location: { protocol: 'http:', hostname: '192.168.1.10' } })
    expect(registerMock).not.toHaveBeenCalled()
  })
})
