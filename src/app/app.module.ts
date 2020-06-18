import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AngularFireModule } from "@angular/fire";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireFunctionsModule, ORIGIN } from '@angular/fire/functions';

import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';

import { AuthGuard } from './guards/auth.guard';

import { DateTimePickerDirective } from './directives/date-time-picker.directive';

import { InlineLoadingComponent } from './components/inline-loading/inline-loading.component';

import { AppComponent } from './app.component';
import { SplashComponent } from './views/splash/splash.component';
import { TabComponent } from './layouts/tab/tab.component';
import { MyTokensComponent } from './views/my-tokens/my-tokens.component';
import { StoresComponent } from './views/stores/stores.component';
import { AddStoreComponent } from './views/add-store/add-store.component';
import { ViewStoreComponent } from './views/view-store/view-store.component';
import { NotFoundComponent } from './views/not-found/not-found.component';
import { DateSliderComponent } from './components/date-slider/date-slider.component';
import { TokenComponent } from './views/token/token.component';
import { ScanComponent } from './views/scan/scan.component';
import { StoreManagementComponent } from './views/store-management/store-management.component';
import { JoinQueueComponent } from './views/join-queue/join-queue.component';

@NgModule({
	declarations: [
		DateTimePickerDirective,
		InlineLoadingComponent,
		DateSliderComponent,
		AppComponent,
		SplashComponent,
		TabComponent,
		MyTokensComponent,
		StoresComponent,
		AddStoreComponent,
		ViewStoreComponent,
		NotFoundComponent,
		TokenComponent,
		ScanComponent,
		StoreManagementComponent,
		JoinQueueComponent,
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		FormsModule,
		AngularFireModule.initializeApp(environment.firebase),
		AngularFirestoreModule,
		AngularFireAuthModule,
		AngularFireFunctionsModule
	],
	providers: [
		AuthGuard,
		{ provide: ORIGIN, useValue: 'http://localhost:5001' }
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
