// MigrationV1toV2
class MigrationV1toV2 {
    static needsMigration() {
        const currentVersion = localStorage.getItem('efsin_version');
        return !currentVersion || currentVersion < '2.0.0';
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = MigrationV1toV2;
