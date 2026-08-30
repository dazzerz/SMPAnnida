// =========================================================================
// ENCAPSULATED AUTH MODULE (ACADEMIC)
// =========================================================================

let _currentUser = null;
let _currentTeacher = null;
let _isAdmin = false;
let _isPembina = false;
let _isGuest = false;
let _isLoaded = false;

export const authState = {
    get currentUser() { return _currentUser; },
    get currentTeacher() { return _currentTeacher; },
    get isAdmin() { return _isAdmin; },
    get isPembina() { return _isPembina; },
    get isGuest() { return _isGuest; },
    get isLoaded() { return _isLoaded; },
    
    setAuth(user, teacher, admin, guest, pembina = false) {
        _currentUser = user;
        _currentTeacher = teacher;
        _isAdmin = admin;
        _isGuest = guest;
        _isPembina = pembina;
        _isLoaded = true;
    }
};
