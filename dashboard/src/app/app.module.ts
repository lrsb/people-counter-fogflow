import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatTableModule} from '@angular/material/table';
import {MatSliderModule} from '@angular/material/slider';
import {MatToolbarModule} from '@angular/material/toolbar';
import {FormsModule} from '@angular/forms';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatButtonModule} from '@angular/material/button';
import {SocketIoModule} from 'ngx-socket-io';

// TODO: set your ip
const SOCKET_URL = 'http://localhost:7001';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatTableModule,
        MatSliderModule,
        MatToolbarModule,
        FormsModule,
        MatPaginatorModule,
        HttpClientModule,
        MatSlideToggleModule,
        MatButtonModule,
        SocketIoModule.forRoot({url: SOCKET_URL, options: {}})
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
