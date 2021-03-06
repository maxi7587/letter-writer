import { Component, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatPaginator, MatTableDataSource } from '@angular/material';
import { FormGroup, FormControl } from '@angular/forms';
// import * as xlsx from 'ts-xlsx';
import * as xlsx from 'xlsx';
import { saveAs } from 'file-saver';
// import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as docx from 'docx';

type AOA = any[][];

// tslint:disable prefer-const
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
    public title = 'letter-writer';

    public data: AOA = [ [1, 2], [3, 4] ];
    public wopts: xlsx.WritingOptions = { bookType: 'xlsx', type: 'array' };
    public fileName = 'SheetJS.xlsx';

    public street_filter: string;
    public filtered_data: any[][];

    public displayedColumns: string[] = ['id', 'name', 'address', 'total'];
    public dataSource = new MatTableDataSource<any>(this.filtered_data);
    @ViewChild(MatPaginator) public paginator: MatPaginator;
    @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
        this.paginator = mp;
        this.setDataSourceAttributes();
    }

    public doc: docx.Document;

    public constructor(public changeDetectorRef: ChangeDetectorRef) {}

    public ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
    }

    public setDataSourceAttributes() {
        this.dataSource.paginator = this.paginator;
    }

    public onFileChange(evt: any) {
        /* wire up file reader */
        const target: DataTransfer = <DataTransfer>(evt.target);
        if (target.files.length !== 1) { throw new Error('Cannot use multiple files'); }
        const reader: FileReader = new FileReader();
        reader.onload = (e: any) => {
            /* read workbook */
            const bstr: string = e.target.result;
            const wb: xlsx.WorkBook = xlsx.read(bstr, {type: 'binary'});

            /* grab first sheet */
            const wsname: string = wb.SheetNames[0];
            const ws: xlsx.WorkSheet = wb.Sheets[wsname];

            /* save data */
            this.data = <AOA>(xlsx.utils.sheet_to_json(ws, {header: 1}));
            this.filtered_data = this.data.slice(1);
            this.dataSource.data = this.filtered_data;
            this.changeDetectorRef.detectChanges();
        };
        reader.readAsBinaryString(target.files[0]);
    }

    public filterData(filter) {
        this.filtered_data = this.data.filter(
            row => {
                if (row[3]) {
                    return row[3].toLowerCase().indexOf(filter.toLowerCase()) !== -1;
                } else {
                    return false;
                }
            }
        );
        this.dataSource.data = this.filtered_data;
    }

    public exportPDF(data) {
        this.doc = new docx.Document();
        this.generate(data[0]);
        for (let row of data.slice(1)) {
            this.generate(row, true);
        }
        this.addHeader();
        this.addFooter();
        this.save_document();
        // TODO; create and export pdf from XLS data
    }

    public generate(client_data, new_page = false) {
        const client_name_data: string = client_data[2];
        const client_cuit_data: string = client_data[4];
        const client_address_data: string = client_data[3];
        const client_id_data: string = client_data[1];
        const total_required_data: string = parseInt(client_data[16], 10).toFixed(2);
        const total_charge_data: string = parseInt(client_data[15], 10).toFixed(2);

        let paragraph5;
        if (new_page) {
            paragraph5 = new docx.Paragraph().pageBreakBefore();
        } else {
            paragraph5 = new docx.Paragraph();
        }
        const name = new docx
            .TextRun(`SR/A ${client_name_data}:`)
            .bold();
        paragraph5.addRun(name);

        const paragraph6 = new docx.Paragraph();
        const dni = new docx
            .TextRun(`D.N.I. Nº ${client_cuit_data}`)
            .bold();
        paragraph6.addRun(dni);

        const paragraph7 = new docx.Paragraph();
        const client_address = new docx
            .TextRun(`DIR: ${client_address_data}`)
            .bold();
        paragraph7.addRun(client_address);

        const paragraph8 = new docx.Paragraph();
        const client_id = new docx
            .TextRun(`CL Nº ${client_id_data}`)
            .bold();
        paragraph8.addRun(client_id);

        const paragraph9 = new docx.Paragraph().justified();
        const body = new docx
            .TextRun(
                `Nos comunicamos con usted por la presente en representación de “CALZADOS LOS GALLEGOS S.R.L.”, \
ya que registramos a la fecha un saldo impago que mantiene con esta empresa, la cual actualmente asciende al monto \
de $${total_required_data} correspondiendo la misma a la compra de mercadería realizada por usted en las \
instalaciones de la entidad, resultando este monto la suma de capital, intereses y honorarios.`
            );
        paragraph9.addRun(body);

        const paragraph10 = new docx.Paragraph().justified();
        const body_2 = new docx
            .TextRun(`POR ESTE MOTIVO LO INTIMAMOS A QUE CONCURRA A NUESTRO `);
        const body_2_1 = new docx
            .TextRun(`ESTUDIO JURÍDICO`).bold();
        const body_2_2 = new docx
            .TextRun(` UBICADO EN CALLE `);
        const body_2_3 = new docx
            .TextRun(`LAS HERAS 148 o LAS HERAS 168`).bold();
        const body_2_4 = new docx
            .TextRun(` DE ESTÁ CIUDAD DE SAN RAFAEL, MENDOZA, DENTRO DE LAS 48 HS. DE RECIBIDA LA PRESENTE, \
OTORGÁNDOLE POR ÚNICA VEZ LA POSIBILIDAD DE REGULARIZAR SU SITUACION POR UN `);
        const body_2_5 = new docx
            .TextRun(`MONTO TOTAL DE $${total_charge_data}`).bold();
        const body_2_6 = new docx
            .TextRun(` CON EL CUAL SE CANCELARÍA TOTALMENTE SU DEUDA, \
ACCEDIENDO AUTOMÁTICAMENTE A UNA POSIBLE FINANCIACIÓN EN LOS PRODUCTOS DE LA EMPRESA Y UNA DESVINCULACIÓN DE LOS SISTEMAS \
DE VERAZ Y CODESUR. CASO CONTRARIO SE INICIARÁN LAS ACCIONES LEAGLES CORRESPONDIENTES.`);
        paragraph10
            .addRun(body_2)
            .addRun(body_2_1)
            .addRun(body_2_2)
            .addRun(body_2_3)
            .addRun(body_2_4)
            .addRun(body_2_5)
            .addRun(body_2_6);

        const paragraph11 = new docx.Paragraph().justified();
        const atention_time = new docx
            .TextRun(`HORARIOS DE ATENCIÓN: LUNES A VIERNES DE 9:00HS A 12:30HS Y DE 17:30HS A 20:00HS (MES DE JULIO DE \
9:00 AM A 13:00 PM). PARA CONCURRIR A PAGAR EN OTROS HORARIOS COMUNÍQUESE TELEFÓNICAMENTE.`);
        paragraph11.addRun(atention_time);

        const paragraph12 = new docx.Paragraph().justified();
        const expires_in = new docx
            .TextRun(`Esta propuesta vence a las 48 HS.`);
        paragraph12.addRun(expires_in);

        const white_line = new docx.Paragraph();

        this.doc.addParagraph(white_line);
        this.doc.addParagraph(paragraph5);
        this.doc.addParagraph(paragraph6);
        this.doc.addParagraph(paragraph7);
        this.doc.addParagraph(paragraph8);
        this.doc.addParagraph(white_line);
        this.doc.addParagraph(paragraph9);
        this.doc.addParagraph(white_line);
        this.doc.addParagraph(paragraph10);
        this.doc.addParagraph(white_line);
        this.doc.addParagraph(paragraph11);
        this.doc.addParagraph(white_line);
        // NOTE: paragraph 12 was replaced with table
        // this.doc.addParagraph(paragraph12);
        // this.doc.addParagraph(white_line);
        let important_advise_table = this.doc.createTable(1, 1);
        important_advise_table.getCell(0, 0).addContent(
            new docx.Paragraph()
            .addRun(new docx.TextRun(`IMPORTANTE:`).underline().bold())
            .addRun(new docx.TextRun(` PRESENTANDO ESTE CUPÓN OBTENDRA UN DESCUENTO EXCLUSIVO EN LOS INTERESES POR ÚNICA VEZ.`))
        ).addContent(
            new docx.Paragraph(`DENTRO DE LAS 24 HORAS DE RECIBIDO: DESDE UN 30% HASTA UN 40%`).bullet()
        ).addContent(
            new docx.Paragraph(`DENTRO DE LAS 48 HS. DESDE UN 10 % HASTA UN 25 %.`).bullet()
        ).addContent(
            new docx.Paragraph()
            .addRun(new docx.TextRun(`RECUERDE ESTE DESCEUNTO ES POR `))
            .addRun(new docx.TextRun(`ÚNICA VEZ.`).underline().bold())
        );
        this.doc.addParagraph(white_line);
        this.doc.addParagraph(white_line);
        this.doc.addParagraph(white_line);
        this.doc.addParagraph(white_line);
        this.doc.addParagraph(white_line);
        this.doc.addParagraph(white_line);
        this.doc.addParagraph(white_line);
        this.doc.addParagraph(white_line);
        this.doc.addParagraph(white_line);
        let table = this.doc.createTable(1, 3);
        table.getCell(0, 0).addContent(
            new docx.Paragraph()
            .addRun(new docx.TextRun('').underline())
        ).addContent(
            new docx.Paragraph(`Juan Manuel Pérez`)
        ).addContent(
            new docx.Paragraph(`ABOGADO`)
        ).addContent(
            new docx.Paragraph(`M.P. 10092`)
        );
        table.getCell(0, 1).addContent(
            new docx.Paragraph()
            .addRun(new docx.TextRun('').underline())
        ).addContent(
            new docx.Paragraph(`Marco Valentín Cruz`)
        );
        table.getCell(0, 2).addContent(
            new docx.Paragraph()
            .addRun(new docx.TextRun('').underline())
        ).addContent(
            new docx.Paragraph(`Hugo Jesús Hauser`)
        ).addContent(
            new docx.Paragraph(`ABOGADO`)
        ).addContent(
            new docx.Paragraph(`M.P. 9827`)
        );

        for (let border of ((table.Properties.setWidth(docx.WidthType.AUTO, 100) as any).root[1] as any).root) {
            (border.root[0] as any).root.value = null;
        }
    }

    public save_document(file_name = 'letters.docx') {
        const packer = new docx.Packer();

        packer.toBlob(this.doc).then(blob => {
            console.log(blob);
            saveAs(blob, file_name);
            console.log('Document created successfully');
        });
    }

    public addHeader() {
        let paragraph = new docx
                .Paragraph('ESTUDIO JURÍDICO')
                .heading1();
        const paragraph2 = new docx.Paragraph();
        const address = new docx
            .TextRun('Dirección: Las Heras 168 - Las Heras 168')
            .bold();
        const phone = new docx
            .TextRun('Teléfono: 2604423601 Celular: 260-154845351')
            .tab()
            .bold();
        paragraph2.addRun(address);
        paragraph2.addRun(phone);

        const paragraph3 = new docx.Paragraph().justified().thematicBreak();

        const paragraph4 = new docx.Paragraph().end();
        let date = new Date();
        let options = { year: 'numeric', month: 'long', day: 'numeric' };
        const origin = new docx
            .TextRun(`\nSan Rafael, Mendoza ${date.toLocaleDateString('es-ES', options)}`)
            .bold();
        paragraph4.addRun(origin);

        this.doc.Header.addParagraph(paragraph);
        this.doc.Header.addParagraph(paragraph2);
        this.doc.Header.addParagraph(paragraph3);
        this.doc.Header.addParagraph(paragraph4);
    }

    public addFooter() {
        // TODO: create table for signatures
        // let table = this.doc
        //     // .Footer
        //     .createTable(2, 2)
        //     .setWidth(docx.WidthType.PERCENTAGE, 100)
        //     .getCell(1, 1)
        //     .addContent(
        //         new docx.Paragraph().addRun(new docx.TextRun('This text should be in the middle of the cell'))
        //         // new docx.Paragraph('This text should be in the middle of the cell')
        //     )
        //     .CellProperties.setWidth(100, docx.WidthType.AUTO);
        // let table = new docx.Table(3, 4, [25, 25, 25, 25]);

        const paragraph13 = new docx.Paragraph();
        const firm_line_1 = new docx
            .TextRun(`                     `)
            .underline()
            .tab()
            .tab()
            .tab();
        const firm_line_2 = new docx
            .TextRun(`                     `)
            .underline()
            .tab()
            .tab()
            .tab();
        const firm_line_3 = new docx
            .TextRun(`                     `)
            .underline()
            .tab()
            .tab()
            .tab();
        paragraph13.addRun(firm_line_1);
        paragraph13.addRun(firm_line_2);
        paragraph13.addRun(firm_line_3);

        const paragraph14 = new docx.Paragraph();
        const firm_name_1 = new docx
            .TextRun(`Juan Manuel Pérez`)
            .tab()
            .tab()
            .tab();
        const firm_name_2 = new docx
            .TextRun(`Marco Valentín Cruz`)
            .tab()
            .tab()
            .tab();
        const firm_name_3 = new docx
            .TextRun(`Hugo Jesús Hauser`)
            .tab()
            .tab()
            .tab();
        paragraph14.addRun(firm_name_1);
        paragraph14.addRun(firm_name_2);
        paragraph14.addRun(firm_name_3);

        const paragraph15 = new docx.Paragraph();
        const firm_title_1 = new docx
            .TextRun(`     ABOGADO     `)
            .tab()
            .tab()
            .tab();
        const firm_title_2 = new docx
            .TextRun(`                 `)
            .tab()
            .tab()
            .tab();
        const firm_title_3 = new docx
            .TextRun(`     ABOGADO     `)
            .tab()
            .tab()
            .tab();
        paragraph15.addRun(firm_title_1);
        paragraph15.addRun(firm_title_2);
        paragraph15.addRun(firm_title_3);

        const paragraph16 = new docx.Paragraph();
        const firm_mat_1 = new docx
            .TextRun(`M.P. 10092`)
            .tab()
            .tab();
        const firm_mat_2 = new docx
            .TextRun(` `)
            .tab()
            .tab();
        const firm_mat_3 = new docx
            .TextRun(`M.P. 9827`)
            .tab()
            .tab();
        paragraph16.addRun(firm_mat_1);
        paragraph16.addRun(firm_mat_2);
        paragraph16.addRun(firm_mat_3);

        // this.doc.Footer.addParagraph(paragraph13);
        // this.doc.Footer.addParagraph(paragraph14);
        // this.doc.Footer.addParagraph(paragraph15);
        // this.doc.Footer.addParagraph(paragraph16);
        let table = this.doc.createTable(4, 4);
        table.getCell(2, 2).addContent(new docx.Paragraph('Hello'));
        // this.doc.Footer.addTable(table.setFixedWidthLayout());
    }
}
