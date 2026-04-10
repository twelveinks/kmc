const { ipcRenderer } = require('electron');
// var ImageCompressor=require('image-compressor.js');
//get all elements from the main window required for verification
const submit = document.getElementById('proceed');
const reset = document.getElementById('reset');
const backBtn = document.getElementById('backToDashboard');

// Listen for form data restoration
ipcRenderer.on('restore-form-data', (event, formData) => {
    if (formData) {
        // Restore all form fields
        patient_no.value = formData.patient_no;
        firstName.value = formData.firstName;
        lastName.value = formData.lastName;
        gender.value = formData.gender;
        age.value = formData.age;
        date.value = formData.date;
        preOp.value = formData.preOp;
        scopicFindings.value = formData.scopicFindings;
        scopicDiagnosis.value = formData.scopicDiagnosis;
        biopay.value = formData.biopay;
        doctorsAdvice.value = formData.doctorsAdvice;
        caption1.value = formData.caption1;
        caption2.value = formData.caption2;
        caption3.value = formData.caption3;
        caption4.value = formData.caption4;
        caption5.value = formData.caption5;
        caption6.value = formData.caption6;
        
        // Restore images if they were saved
        if (formData.collector) {
            collector = formData.collector;
        }
    }
});

submit.addEventListener('click', validate);
reset.addEventListener('click', function (e) {
    // window.reload(BrowserWindow.getFocusedWindow());
    ipcRenderer.send('reload');
});

backBtn.addEventListener('click', function (e) {
    window.location.href = 'dashboard.html';
});
//medical information
const patient_no = document.getElementById('patient_no');
const firstName = document.getElementById('firstName');
const lastName = document.getElementById('lastName');
const gender = document.getElementById('gender');
const age = document.getElementById('age');
const date = document.getElementById('date');
const preOp = document.getElementById('pre-op');
const scopicFindings = document.getElementById('scopic-findings');
const scopicDiagnosis = document.getElementById('scopic-diagnosis');
const biopay = document.getElementById('biopay');
//radio buttons
let radio1 = document.getElementById('customRadio');
let radio2 = document.getElementById('customRadio2');
let radio3 = document.getElementById('customRadio3');

const fig5 = document.getElementById('fig5');
const fig6 = document.getElementById('fig6');


//save all the captions within the html element
const caption1 = document.getElementById('fig1Caption');
const caption2 = document.getElementById('fig2Caption');
const caption3 = document.getElementById('fig3Caption');
const caption4 = document.getElementById('fig4Caption');
const caption5 = document.getElementById('fig5Caption');
const caption6 = document.getElementById('fig6Caption');
const figureGroup1 = document.getElementById('figure-group1');
const figureGroup2 = document.getElementById('figure-group2');
const figureGroup3 = document.getElementById('figure-group3');
const imageContainer = document.querySelectorAll('.img-container img');
radio3.addEventListener('change', () => {
    //console.log(radio3.checked);
    if (radio3.checked) {
        scopicDiagnosis.setAttribute('disabled', true);
        biopay.setAttribute('disabled', true);
        figureGroup1.setAttribute('class', 'col-md-6 figure-group1');
        figureGroup2.setAttribute('class', 'col-md-6 figure-group2');
        figureGroup3.style.display = "none";
        figureGroup1.style.padding = '0 0 0 5rem';

    }
});
radio2.addEventListener('change', () => {
    if (radio2.checked) {
        scopicDiagnosis.removeAttribute('disabled');
        biopay.removeAttribute('disabled');
        figureGroup1.setAttribute('class', 'col-md-4 figure-group1');
        figureGroup2.setAttribute('class', 'col-md-4 figure-group2');
        figureGroup3.setAttribute('class', 'col-md-4 figure-group3');
        figureGroup3.style.display = "block";
        figureGroup1.style.padding = '0 0 0 1rem';

        for (var i = 0; i < imageContainer.length; ++i) {
            var imgElement = imageContainer[i];
            imgElement.style.margin = '-0.8rem -1rem -2rem -2rem';
        }

    }
});
radio1.addEventListener('change', () => {
    if (radio1.checked) {
        scopicDiagnosis.removeAttribute('disabled');
        biopay.removeAttribute('disabled');
        figureGroup1.setAttribute('class', 'col-md-4 figure-group1');
        figureGroup2.setAttribute('class', 'col-md-4 figure-group2');
        figureGroup3.setAttribute('class', 'col-md-4 figure-group3');
        figureGroup3.style.display = "block";
        figureGroup1.style.padding = '0 0 0 1rem';
        for (var i = 0; i < imageContainer.length; ++i) {
            var imgElement = imageContainer[i];
            imgElement.style.margin = '-0.8rem -1rem -2rem -2rem';
        }
    }
});


//doctors advice
const doctorsAdvice = document.getElementById('doctors-advice');
const medicationAdministered = document.getElementById('medication-administered');




function validate() {

    if (patient_no.value == '' || patient_no.value < 1) {
        document.querySelector('.invalid-tooltip-1').style.display = "block";
        document.querySelector('.patient_no').setAttribute('class', 'form-control is-invalid');

        patient_no.addEventListener('change', () => {
            if (patient_no.value == '' || patient_no.value < 1) {
                document.querySelector('.invalid-tooltip-1').style.display = "block";
                document.querySelector('.is-valid').setAttribute('class', 'form-control is-invalid');
            }
            document.querySelector('.invalid-tooltip-1').style.display = "none";
            document.querySelector('.is-invalid').setAttribute('class', ' form-control is-valid');
        });

    }
    if (!(firstName.value)) {
        document.querySelector('.invalid-tooltip-2').style.display = "block";
        document.querySelector('.firstName').setAttribute('class', 'form-control is-invalid');

        firstName.addEventListener('change', () => {
            if (!(firstName.value)) {
                document.querySelector('.invalid-tooltip-2').style.display = "block";
                document.querySelector('.is-valid').setAttribute('class', 'form-control is-invalid');
            }
            document.querySelector('.invalid-tooltip-2').style.display = "none";
            document.querySelector('.is-invalid').setAttribute('class', ' form-control is-valid');
        });
    }
    if (!(lastName.value)) {
        document.querySelector('.invalid-tooltip-3').style.display = "block";
        document.querySelector('.lastName').setAttribute('class', 'form-control is-invalid');

        lastName.addEventListener('change', () => {
            if (!(lastName.value)) {
                document.querySelector('.invalid-tooltip-3').style.display = "block";
                document.querySelector('.is-valid').setAttribute('class', 'form-control is-invalid');
            }
            document.querySelector('.invalid-tooltip-3').style.display = "none";
            document.querySelector('.is-invalid').setAttribute('class', ' form-control is-valid');
        });
    }
    if (!age.value || age.value < 1 || age.value > 150) {
        document.querySelector('.invalid-tooltip-4').style.display = "block";
        document.querySelector('.age').setAttribute('class', 'form-control is-invalid');

        age.addEventListener('change', () => {
            if (!age.value || age.value < 1 || age.value > 150) {
                document.querySelector('.invalid-tooltip-4').style.display = "block";
                document.querySelector('.is-valid').setAttribute('class', 'form-control is-invalid');
            }
            document.querySelector('.invalid-tooltip-4').style.display = "none";
            document.querySelector('.is-invalid').setAttribute('class', ' form-control is-valid');
        });
    }
    if (!date.value) {
        document.querySelector('.invalid-tooltip-5').style.display = "block";
        document.querySelector('.date').setAttribute('class', 'form-control is-invalid');

        date.addEventListener('click', () => {
            if (!date.value) {
                document.querySelector('.invalid-tooltip-5').style.display = "block";
                document.querySelector('.is-valid').setAttribute('class', 'form-control is-invalid');
            }
            document.querySelector('.invalid-tooltip-5').style.display = "none";
            document.querySelector('.is-invalid').setAttribute('class', ' form-control is-valid');
        });
    }
    if (!preOp.value) {
        document.querySelector('.invalid-tooltip-6').style.display = "block";
        document.querySelector('.pre-op').setAttribute('class', 'form-control is-invalid');

        preOp.addEventListener('change', () => {
            if (!preOp.value) {
                document.querySelector('.invalid-tooltip-6').style.display = "block";
                document.querySelector('.is-valid').setAttribute('class', 'form-control is-invalid');
            }
            document.querySelector('.invalid-tooltip-6').style.display = "none";
            document.querySelector('.is-invalid').setAttribute('class', ' form-control is-valid');
        });
    }
    if (!scopicFindings.value) {
        document.querySelector('.invalid-tooltip-7').style.display = "block";
        document.querySelector('.scopic-findings').setAttribute('class', 'form-control is-invalid');

        scopicFindings.addEventListener('change', () => {
            if (!scopicFindings.value) {
                document.querySelector('.invalid-tooltip-7').style.display = "block";
                document.querySelector('.is-valid').setAttribute('class', 'form-control is-invalid');
            }
            document.querySelector('.invalid-tooltip-7').style.display = "none";
            document.querySelector('.is-invalid').setAttribute('class', ' form-control is-valid');
        });
    }
    if (!doctorsAdvice.value) {
        document.querySelector('.invalid-tooltip-10').style.display = "block";
        document.querySelector('.doctors-advice').setAttribute('class', 'form-control is-invalid');

        doctorsAdvice.addEventListener('change', () => {
            if (!doctorsAdvice.value) {
                document.querySelector('.invalid-tooltip-10').style.display = "block";
                document.querySelector('.is-valid').setAttribute('class', 'form-control is-invalid');
            }
            document.querySelector('.invalid-tooltip-10').style.display = "none";
            document.querySelector('.is-invalid').setAttribute('class', ' form-control is-valid');
        });
    }
    if (radio3.checked) {
        if (document.querySelector('.is-invalid')) {
            document.querySelector('.is-invalid').setAttribute('class', ' form-control is-valid')
        }
        document.querySelector('.invalid-tooltip-8').style.display = "none";

        if (document.querySelector('.is-invalid')) {
            document.querySelector('.is-invalid').setAttribute('class', ' form-control is-valid')
        }
        document.querySelector('.invalid-tooltip-9').style.display = "none";

    }
    // if(radio2.checked){
    //     document.querySelector('.figure1 IMG').style.marginLeft='-4rem';
    // }
    if (radio1.checked || radio2.checked) {
        if (!scopicDiagnosis.value) {
            document.querySelector('.invalid-tooltip-8').style.display = "block";
            if (document.querySelector('.scopic-diagnosis')) {
                document.querySelector('.scopic-diagnosis').setAttribute('class', 'form-control is-invalid');
            }

            scopicDiagnosis.addEventListener('change', () => {
                if (!scopicDiagnosis.value) {
                    document.querySelector('.invalid-tooltip-8').style.display = "block";
                    if (document.querySelector('.is-valid')) {
                        document.querySelector('.is-valid').setAttribute('class', 'form-control is-invalid');
                    }

                }
                document.querySelector('.invalid-tooltip-8').style.display = "none";
                if (document.querySelector('.is-invalid')) {
                    document.querySelector('.is-invalid').setAttribute('class', ' form-control is-valid');
                }
            });
        }
        if (!biopay.value) {
            document.querySelector('.invalid-tooltip-9').style.display = "block";
            if (document.querySelector('.biopay')) {
                document.querySelector('.biopay').setAttribute('class', 'form-control is-invalid');
            }

            biopay.addEventListener('change', () => {
                if (!biopay.value) {
                    document.querySelector('.invalid-tooltip-9').style.display = "block";
                    if (document.querySelector('.biopay')) {
                        document.querySelector('.biopay').setAttribute('class', 'form-control is-invalid');
                    }
                }
                document.querySelector('.invalid-tooltip-9').style.display = "none";
                if (document.querySelector('.is-invalid')) {
                    document.querySelector('.is-invalid').setAttribute('class', ' form-control is-valid');
                }
            });
        }
    }
    if (radio1.checked || radio2.checked) {
        if (patient_no.value && firstName.value && lastName.value && age.value && date.value && scopicFindings.value && preOp.value && scopicDiagnosis.value && biopay.value && doctorsAdvice.value) {
            if (radio1.checked) {
                createPDF('endo');
            } else if (radio2.checked) {
                createPDF('colo');
            }
        }
    } else if (radio3.checked) {
        if (patient_no.value && firstName.value && lastName.value && age.value && date.value && scopicFindings.value && preOp.value && doctorsAdvice.value) {
            createPDF('Ent');
        }
    }
}

function createPDF(reportType) {
    // Get form data
    const formData = {
        patient_no: patient_no.value,
        firstName: firstName.value,
        lastName: lastName.value,
        gender: gender.value,
        age: age.value,
        date: date.value,
        preOp: preOp.value,
        scopicFindings: scopicFindings.value,
        scopicDiagnosis: scopicDiagnosis.value,
        biopay: biopay.value,
        doctorsAdvice: doctorsAdvice.value,
        caption1: caption1.value || " ",
        caption2: caption2.value || " ",
        caption3: caption3.value || " ",
        caption4: caption4.value || " ",
        caption5: caption5.value || " ",
        caption6: caption6.value || " ",
        reportType: reportType,
        collector: collector // Save image data
    };
    
    // Store form data for preview
    ipcRenderer.send('preview-form', formData);
    
    // Store form data before sending to preview
    window.currentFormData = {
        patient_no: patient_no.value,
        firstName: firstName.value,
        lastName: lastName.value,
        gender: gender.value,
        age: age.value,
        date: date.value,
        preOp: preOp.value,
        scopicFindings: scopicFindings.value,
        scopicDiagnosis: scopicDiagnosis.value,
        biopay: biopay.value,
        doctorsAdvice: doctorsAdvice.value,
        caption1: caption1.value,
        caption2: caption2.value,
        caption3: caption3.value,
        caption4: caption4.value,
        caption5: caption5.value,
        caption6: caption6.value,
        reportType: reportType
    };
    
    const dataHandler = require('../renderer-process/report');
    //var date=date.value;
    // console.log(collector);
    if (reportType === "endo") {
        var endo = {
            repo_patientNo: patient_no.value,
            repo_name: firstName.value + ' ' + lastName.value,
            repo_sex: gender.value,
            repo_age: age.value,
            repo_date: date.value.replace(/\//g, '-'),
            repo_preOp: preOp.value,
            repo_scopic_findings: scopicFindings.value,
            repo_scopic_diagnosis: scopicDiagnosis.value,
            repo_biopay: biopay.value,
            repo_medication_administered: medicationAdministered ? medicationAdministered.value : '',
            repo_doctors_advice: doctorsAdvice.value,
            repo_caption1: caption1.value,
            repo_caption6: caption6.value,
            repo_caption2: caption2.value,
            repo_caption3: caption3.value,
            repo_caption4: caption4.value,
            repo_caption5: caption5.value,
            repo_figure1: collector[0],
            repo_figure2: collector[1],
            repo_figure3: collector[2],
            repo_figure4: collector[3],
            repo_figure5: collector[4],
            repo_figure6: collector[5],
        };
        dataHandler.endo(endo);


    } else if (reportType === 'Ent') {
        //caption setting
        if (!(caption1.value || caption2.value || caption3.value || caption4.value || caption5.value || caption6.value)) {
            if (!caption1.value) {
                caption1.value = " ";
            } if (!caption2.value) {
                caption2.value = " ";
            } if (!caption3.value) {
                caption3.value = " ";
            } if (!caption4.value) {
                caption4.value = " ";
            } if (!caption5.value) {
                caption5.value = " ";
            } if (!caption6.value) {
                caption6.value = " ";
            }
        }

        var ent = {
            repo_patientNo: patient_no.value,
            repo_name: firstName.value + ' ' + lastName.value,
            repo_sex: gender.value,
            repo_age: age.value,
            repo_date: date.value.replace(/\//g, '-'),
            repo_preOp: preOp.value,
            repo_scopic_findings: scopicFindings.value,
            repo_doctors_advice: doctorsAdvice.value,
            repo_caption1: caption1.value,
            repo_caption2: caption2.value,
            repo_caption3: caption3.value,
            repo_caption4: caption4.value,

            repo_figure1: collector[0],
            repo_figure2: collector[1],
            repo_figure3: collector[2],
            repo_figure4: collector[3],
        };
        dataHandler.ent(ent);

    } else if (reportType === 'colo') {
        //caption setting
        if (!(caption1.value || caption2.value || caption3.value || caption4.value || caption5.value || caption6.value)) {
            if (!caption1.value) {
                caption1.value = " ";
            } if (!caption2.value) {
                caption2.value = " ";
            } if (!caption3.value) {
                caption3.value = " ";
            } if (!caption4.value) {
                caption4.value = " ";
            } if (!caption5.value) {
                caption5.value = " ";
            } if (!caption6.value) {
                caption6.value = " ";
            }
        }
        var colo = {
            repo_patientNo: patient_no.value,
            repo_name: firstName.value + ' ' + lastName.value,
            repo_sex: gender.value,
            repo_age: age.value,
            repo_date: date.value.replace(/\//g, '-'),
            repo_preOp: preOp.value,
            repo_scopic_findings: scopicFindings.value,
            repo_scopic_diagnosis: scopicDiagnosis.value,
            repo_biopay: biopay.value,
            repo_medication_administered: medicationAdministered ? medicationAdministered.value : '',
            repo_doctors_advice: doctorsAdvice.value,
            repo_caption1: caption1.value,
            repo_caption6: caption6.value,
            repo_caption2: caption2.value,
            repo_caption3: caption3.value,
            repo_caption4: caption4.value,
            repo_caption5: caption5.value,
            repo_figure1: collector[0],
            repo_figure2: collector[1],
            repo_figure3: collector[2],
            repo_figure4: collector[3],
            repo_figure5: collector[4],
            repo_figure6: collector[5],
        };
        dataHandler.colo(colo);

    }
}

