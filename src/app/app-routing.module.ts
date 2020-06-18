import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';

import { TabComponent } from './layouts/tab/tab.component';

import { SplashComponent } from './views/splash/splash.component';
import { MyTokensComponent } from './views/my-tokens/my-tokens.component';
import { StoresComponent } from './views/stores/stores.component';
import { AddStoreComponent } from './views/add-store/add-store.component';
import { ViewStoreComponent } from './views/view-store/view-store.component';
import { TokenComponent } from './views/token/token.component';
import { ScanComponent } from './views/scan/scan.component';
import { NotFoundComponent } from './views/not-found/not-found.component';
import { StoreManagementComponent } from './views/store-management/store-management.component';
import { JoinQueueComponent } from './views/join-queue/join-queue.component';

const routes: Routes = [
	{ path: '', component: SplashComponent },
	{
		path: '', component: TabComponent, children: [
			{ path: 'home', redirectTo: '/my-tokens', pathMatch: 'full' },
			{ path: 'my-tokens', component: MyTokensComponent },
			{ path: 'stores', component: StoresComponent },
			{ path: 'stores/add', component: AddStoreComponent, canActivate: [AuthGuard] },
			{ path: 'stores/manage', component: StoreManagementComponent, canActivate: [AuthGuard] },
			{ path: 'stores/manage/:store_slug', component: StoreManagementComponent, canActivate: [AuthGuard] },
			{ path: 'stores/edit/:store_id', component: AddStoreComponent, canActivate: [AuthGuard] },
			{ path: 'store/:store_slug', component: ViewStoreComponent },
			{ path: 'token/:token_id', component: TokenComponent },
			{ path: 'q/:store_id', component: JoinQueueComponent },
			{ path: 'scan', component: ScanComponent },
			{ path: 'scan/:token_id', component: ScanComponent },
			{ path: 'not-found', component: NotFoundComponent },
			{ path: '**', component: NotFoundComponent },
		]
	},
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
