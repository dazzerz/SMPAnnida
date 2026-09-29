// =========================================================================
// ENCAPSULATED AUTH MODULE (ACADEMIC)
// =========================================================================

let _currentUser = null;
let _currentTeacher = null;
let _isAdmin = false;
let _isPembina = false;
let _isLoaded = false;

export const authState = {
    get currentUser() { return _currentUser; },
    get currentTeacher() { return _currentTeacher; },
    get isAdmin() { return _isAdmin; },
    get isPembina() { return _isPembina; },
    // Getter dipertahankan (=false) agar kode lama tidak crash, tidak pernah true lagi.
    get isGuest() { return false; },
    setAuth(user, teacher, admin, pembina = false) {
        _currentUser = user;
        _currentTeacher = teacher;
        _isAdmin = !!admin;
        _isPembina = !!pembina;
        _isLoaded = true;
    },
};
