import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
// import * as XLSX from 'ts-xlsx';
import * as XLSX from 'xlsx';

type AOA = any[][];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
    public title = 'letter-writer';

    public data: AOA = [ [1, 2], [3, 4] ];
    public wopts: XLSX.WritingOptions = { bookType: 'xlsx', type: 'array' };
    public fileName = 'SheetJS.xlsx';

    public street_filter: string;
    public filtered_data: any[][];

    public onFileChange(evt: any) {
        /* wire up file reader */
        const target: DataTransfer = <DataTransfer>(evt.target);
        if (target.files.length !== 1) { throw new Error('Cannot use multiple files'); }
        const reader: FileReader = new FileReader();
        reader.onload = (e: any) => {
            /* read workbook */
            const bstr: string = e.target.result;
            const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});

            /* grab first sheet */
            const wsname: string = wb.SheetNames[0];
            const ws: XLSX.WorkSheet = wb.Sheets[wsname];

            /* save data */
            this.data = <AOA>(XLSX.utils.sheet_to_json(ws, {header: 1}));
            this.filtered_data = this.data;
            console.log('data --------->', this.data);
        };
        reader.readAsBinaryString(target.files[0]);
    }

    public filterData(filter) {
        this.filtered_data = this.data.filter(
            row => {
                if (row[3]) {
                    console.log(row[3]);

                    return row[3].toLowerCase().indexOf(filter.toLowerCase()) !== -1;
                } else {
                    return false;
                }
            }
        );
    }

    public exportPDF(data) {
        // TODO; create and export pdf from XLS data
    }
}
