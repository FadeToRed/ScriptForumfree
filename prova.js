// Fix Per gli Avatar nelle Citazioni (Desktop + Mobile)
(function() {
    // Funzione principale del fix
    function applyAvatarFix() {
        // Rileva se siamo su ForumFree Mobile usando l'oggetto Commons
        const isMobile = window.Commons && window.Commons.forum && window.Commons.forum.isFFMobile;
        
        const defaultAvatar = "https://upload.forumfree.net/i/ff13982804/Hunter/NoAvatar.png";
        
        // NON rimuovere gli avatar esistenti se sono già corretti
        document.querySelectorAll('.quoteentry').forEach(el => {
            const img = el.querySelector('img');
            if (img && (img.src.includes('default_avatar') || img.src.includes('RDGkT8W'))) {
                el.remove();
            }
        });
        
        const styleId = 'ffav-quote-fix-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            
            // CSS diverso per mobile e desktop
            if (isMobile) {
                style.textContent = `
                    #ffav_quote {
                        padding-left: 70px !important; 
                        padding-bottom: 5px !important;
                    }
                    .quote {
                        padding-left: 70px; 
                        min-height: 75px;
                    }
                    .quoteentry img {
                        width: 50px;
                        box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
                        height: 50px;
                        float: left;
                        margin-top: 8px;
                        margin-left: 10px;
                        padding: 1px;
                        border: 1px solid #D5D5D5;
                        background: #FFF;
                    }
                `;
            } else {
                style.textContent = `
                    #ffav_quote {
                        padding-left: 83px !important; 
                        padding-bottom: 5px !important;
                    }
                    .quote {
                        padding-left: 83px; 
                        min-height: 85px;
                    }
                    .quoteentry img {
                        width: 60px;
                        box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
                        height: 60px;
                        float: left;
                        margin-top: 10px;
                        margin-left: 30px;
                        padding: 1px;
                        border: 1px solid #D5D5D5;
                        background: #FFF;
                    }
                `;
            }
            document.head.appendChild(style);
        }
        
        const quoteTops = document.querySelectorAll('.quote_top');
        
        quoteTops.forEach((quoteTop) => {
            const existingAvatar = quoteTop.nextElementSibling;
            if (existingAvatar && existingAvatar.classList.contains('quoteentry')) {
                const existingImg = existingAvatar.querySelector('img');
                if (existingImg && !existingImg.src.includes('default_avatar') && !existingImg.src.includes('RDGkT8W')) {
                    return;
                }
            }
            
            const quote = quoteTop.closest('.quote');
            if (quote) {
                quote.classList.add('ffav_quote');
            }
            
            const quoteLink = quoteTop.querySelector('a[href*="#entry"]');
            let avatarUrl = defaultAvatar;
            
            if (quoteLink) {
                const href = quoteLink.getAttribute('href');
                const entryMatch = href.match(/#entry(\d+)/);
                
                if (entryMatch) {
                    const entryNumber = entryMatch[1];
                    const fullEntryId = 'ee' + entryNumber;
                    
                    const targetPost = document.getElementById(fullEntryId);
                    
                    if (targetPost) {
                        let avatarImg = targetPost.querySelector('.post .avatar img');
                        
                        if (!avatarImg) {
                            avatarImg = targetPost.querySelector('.details .avatar img');
                        }
                        
                        if (!avatarImg) {
                            avatarImg = targetPost.querySelector('.details img[alt="Avatar"]');
                        }
                        
                        if (!avatarImg) {
                            avatarImg = targetPost.querySelector('.post .details img');
                        }
                        
                        if (!avatarImg && isMobile) {
                            avatarImg = targetPost.querySelector('.avatar img');
                        }
                        
                        if (avatarImg && avatarImg.src) {
                            avatarUrl = avatarImg.src;
                        }
                    }
                }
            }
            
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'quoteentry';
            
            const img = document.createElement('img');
            img.src = avatarUrl;
            img.alt = 'Avatar';
            img.onerror = function() {
                this.src = defaultAvatar;
            };
            
            avatarDiv.appendChild(img);
            quoteTop.insertAdjacentElement('afterend', avatarDiv);
        });
    }
    
    // Aspetta che window.Commons sia disponibile
    if (window.Commons && window.Commons.forum) {
        // Commons è già disponibile, esegui subito
        setTimeout(applyAvatarFix, 1000);
    } else {
        // Commons non è ancora disponibile, aspetta
        let checkInterval = setInterval(function() {
            if (window.Commons && window.Commons.forum) {
                clearInterval(checkInterval);
                setTimeout(applyAvatarFix, 1000);
            }
        }, 100);
        
        // Timeout di sicurezza: dopo 5 secondi esegui comunque
        setTimeout(function() {
            clearInterval(checkInterval);
            if (!document.getElementById('ffav-quote-fix-styles')) {
                applyAvatarFix();
            }
        }, 5000);
    }
})();
