(function() {
    function patchTooltip() {
        const icon = document.querySelector('.team-zone-show-suspended-members');
        if (!icon) return;

        const attrs = ['data-tooltip', 'data-info', 'title', 'aria-label', 'data-title', 'data-content'];
        attrs.forEach(attr => {
            if (icon.getAttribute(attr) === 'Mostra Membri Sospesi') {
                icon.setAttribute(attr, 'Staff ad Honorem');
            }
        });
    }

    function addRecruitBanner() {
        const config = window.TeamZoneConfig?.recruit;
        if (!config) {
            setTimeout(addRecruitBanner, 300);
            return;
        }
        if (!config.enabled) return;

        const list = document.querySelector('.team-zone-content.team-zone-member-list');
        if (!list) {
            setTimeout(addRecruitBanner, 300);
            return;
        }

        let banner = document.createElement('DIV');
        banner.className = 'team-zone-recruit-banner';
        banner.innerHTML = config.text.replace('{url}', config.url);
        list.appendChild(banner);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            patchTooltip();
            addRecruitBanner();
        });
    } else {
        setTimeout(() => {
            patchTooltip();
            addRecruitBanner();
        }, 500);
    }
})();
