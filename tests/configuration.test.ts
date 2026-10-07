import app from '../app.json';
import eas from '../eas.json';
import manifest from '../package.json';

describe('reproducible foundation configuration', () => {
  it('pins every direct dependency to a release version', () => {
    for (const version of Object.values({
      ...manifest.dependencies,
      ...manifest.devDependencies,
    })) {
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it('uses Router with static Metro web output and light appearance', () => {
    expect(manifest.main).toBe('expo-router/entry');
    expect(app.expo.plugins).toContain('expo-router');
    expect(app.expo.web).toEqual({ bundler: 'metro', output: 'static' });
    expect(app.expo.userInterfaceStyle).toBe('light');
  });

  it('separates development, preview and store builds', () => {
    expect(eas.cli.requireCommit).toBe(true);
    expect(eas.build.development.developmentClient).toBe(true);
    expect(eas.build.development.environment).toBe('development');
    expect(eas.build.simulator.extends).toBe('development');
    expect(eas.build.simulator.ios.simulator).toBe(true);
    expect(eas.build.preview.environment).toBe('preview');
    expect(eas.build.preview.android.buildType).toBe('apk');
    expect(eas.build.production.environment).toBe('production');
    expect(eas.build.production.distribution).toBe('store');
    expect(eas.build.production.android.buildType).toBe('app-bundle');
    expect(eas.build.production).not.toHaveProperty('developmentClient');
  });
});
