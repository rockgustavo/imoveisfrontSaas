import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import Keycloak from 'keycloak-js';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: Keycloak, useValue: { authenticated: false, tokenParsed: {}, hasRealmRole: () => false } }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
