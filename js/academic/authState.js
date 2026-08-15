// =========================================================================
// P2 FIX: ENCAPSULATED AUTH MODULE (ACADEMIC)
// =========================================================================
// Modul ini menggantikan pemakaian variabel global authState.isAdmin dkk.
// Ini mencegah state dimanipulasi dari console F12 oleh pengguna jahil.

let _currentUser = null;
let _currentTeacher = null;
let _isAdmin = false;
let _isGuest = false;

export const authState = {
    get currentUser() { return _currentUser; },
    get currentTeacher() { return _currentTeacher; },
    get isAdmin() { return _isAdmin; },
    get isGuest() { return _isGuest; },
    
    setAuth(user, teacher, admin, guest) {
        _currentUser = user;
        _currentTeacher = teacher;
        _isAdmin = admin;
        _isGuest = guest;
    }
};

