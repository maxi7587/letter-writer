import { NgModule } from '@angular/core';
import { SharedMaterialModule } from 'src/app/shared/shared-material.module';
import { UploadComponent } from 'src/app/shared/upload-component/upload-component';
import { CommonModule } from '@angular/common';
import { NgxUploaderModule } from 'ngx-uploader';

@NgModule({
    declarations: [
        UploadComponent
    ],
    exports: [
        UploadComponent,
        NgxUploaderModule,
        SharedMaterialModule
    ],
    imports: [
        CommonModule,
        NgxUploaderModule,
        SharedMaterialModule
    ]
})
export class SharedModule { }
