// MultiFileGitHubSync v2.0.0
class MultiFileGitHubSync {
    constructor(categoryManager, imageManager) {
        this.categoryManager = categoryManager;
        this.imageManager = imageManager;
        this.token = localStorage.getItem('efsin_github_token');
        this.owner = localStorage.getItem('efsin_github_owner');
        this.repo = localStorage.getItem('efsin_github_repo');
        this.branch = 'main';
        this.syncInterval = null;
        this.isSyncing = false;
        this.fileSHAs = new Map();
    }

    isConfigured() {
        return !!(this.token && this.owner && this.repo);
    }

    async smartSync() {
        if (this.isSyncing) return { status: 'busy' };
        this.isSyncing = true;
        try {
            console.log('🔄 Smart Sync...');
            return { status: 'success' };
        } catch (error) {
            return { status: 'error', error };
        } finally {
            this.isSyncing = false;
        }
    }

    startAutoSync(intervalMinutes = 5) {
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = setInterval(() => this.smartSync(), intervalMinutes * 60 * 1000);
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
}
if (typeof module !== 'undefined' && module.exports) module.exports = MultiFileGitHubSync;
