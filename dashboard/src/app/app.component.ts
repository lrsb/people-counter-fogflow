import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {HttpClient} from '@angular/common/http';
import {Subject, timer} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Socket} from 'ngx-socket-io';

// TODO: set your ip
const BROKER_URL = 'http://localhost:8070';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
    @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

    counterNumber = 1;
    displayedColumns: string[] = ['name', 'affluence', 'next', 'control'];
    dataSource = new MatTableDataSource<PeopleCounter>([]);
    destroyed = new Subject();

    constructor(private http: HttpClient, private socket: Socket) {
    }

    ngOnInit() {
        this.dataSource.paginator = this.paginator;
        const source = timer(0, 10000);
        source.pipe(takeUntil(this.destroyed)).subscribe(() => {
            this.dataSource.data.filter(element => element.random).forEach(element => {
                const i = element.name.replace('PeopleCounter.', '');
                const counter = this.dataSource.data[i];
                const affluence = Math.floor(Math.random() * 100);
                const male = Math.floor(Math.random() * affluence);
                counter.affluence = {male, female: affluence - male};
                counter.nextAffluence = affluence;
                this.updateCounter(counter);
            });
        });
        this.socket.fromEvent('message').pipe(takeUntil(this.destroyed)).subscribe((data: { id: string, next: string }) => {
            this.dataSource.data
                .filter(el => el.name.includes(data.id.replace('EBoard.', '')))[0]
                .nextCounter = data.next;
            this.dataSource._updateChangeSubscription();
        });
        this.sliderValueChanged();
    }

    sliderValueChanged() {
        if (this.dataSource.data.length < this.counterNumber) {
            for (let i = this.dataSource.data.length; i < this.counterNumber; i++) {
                const affluence = Math.floor(Math.random() * 100);
                const male = Math.floor(Math.random() * affluence);
                const counter = new PeopleCounter(i, male, affluence - male, Math.random(), Math.random());
                this.dataSource.data.push(counter);
                this.registerBoard(i);
                this.updateCounter(counter);
            }
        } else {
            for (let i = this.dataSource.data.length; i > this.counterNumber; i--) {
                this.dataSource.data.pop();
            }
        }
        this.dataSource._updateChangeSubscription();
    }

    elementValueChanged(counter) {
        const newCounter = this.dataSource.data[counter.name.replace('PeopleCounter.', '')];
        const male = Math.floor(Math.random() * newCounter.nextAffluence);
        newCounter.affluence = {male, female: newCounter.nextAffluence - male};
        this.updateCounter(newCounter);
    }

    updateCounter(counter: PeopleCounter) {
        const updateCtxReq = {
            contextElements: [counter.getEntity()],
            updateAction: 'UPDATE'
        };
        this.http.post(BROKER_URL + '/ngsi10/updateContext', updateCtxReq).subscribe(data => {
            console.log(data);
        });
    }

    registerBoard(i) {
        this.socket.emit('register', {id: i});
    }

    randomizeAll() {
        this.dataSource.data.forEach(el => el.random = true);
    }

    ngOnDestroy(): void {
        this.destroyed.next();
    }
}

export class PeopleCounter {
    name: string;
    affluence: {
        male: number,
        female: number
    };
    nextCounter: string;
    nextAffluence: number;
    location: {
        lat: number,
        lon: number
    };
    random = false;

    constructor(id, male, female, lat, lon) {
        this.name = 'PeopleCounter.' + id;
        this.nextCounter = 'Waiting for FogFlow';
        this.nextAffluence = male + female;
        this.affluence = {male, female};
        this.location = {lat, lon};
    }

    getEntity() {
        return {
            entityId: {
                id: this.name,
                type: 'PeopleCounter',
                isPattern: false
            },
            attributes: [{
                name: 'count',
                type: 'integer',
                value: this.affluence.male + this.affluence.female
            }, {
                name: 'male',
                type: 'integer',
                value: this.affluence.male
            }, {
                name: 'female',
                type: 'integer',
                value: this.affluence.female
            }],
            domainMetadata: [{
                name: 'location',
                type: 'point',
                value: {
                    latitude: this.location.lat,
                    longitude: this.location.lon
                }
            }, {
                name: 'timestamp',
                type: 'integer',
                value: Date.now()
            }]
        };
    }
}
