import Swal from 'sweetalert2';
export { Swal };

export const rgpSwal = Swal.mixin({
    customClass: {
        popup: 'rpg-swal-popup rpg-shop auth-card',
        title: 'rpg-swal-title',
        htmlContainer: 'rpg-swal-content',
        actions: 'rpg-swal-actions',
        confirmButton: 'primary-btn mini rpg-swal-confirm',
        cancelButton: 'secondary-btn mini rpg-swal-cancel',
        header: 'rpg-swal-header'
    },
    buttonsStyling: false,
    background: '#0f172a',
    color: '#fff',
    heightAuto: false,
    backdrop: `rgba(0,0,0,0.4)`,
    allowOutsideClick: false
});

export const showAlert = (title, text, icon = 'info') => {
    return rgpSwal.fire({
        title,
        text,
        icon,
        confirmButtonText: 'Entendido'
    });
};

export const showConfirm = (title, text, onConfirm, onCancel) => {
    return rgpSwal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            if (onConfirm) onConfirm();
        } else if (result.dismiss === Swal.DismissReason.cancel || result.dismiss === Swal.DismissReason.backdrop) {
            if (onCancel) onCancel();
        }
    });
};

export const showPrompt = (title, text, inputType = 'text', defaultValue = '', onConfirm) => {
    return rgpSwal.fire({
        title,
        text,
        input: inputType,
        inputValue: defaultValue,
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            if (onConfirm) onConfirm(result.value);
        }
    });
};

export const closeAllModals = () => {
    Swal.close();
};
