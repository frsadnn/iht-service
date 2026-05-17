function setupFirebaseListener() {
  setSyncStatus('syncing');

  if (fbReqRef) { fbReqRef.off(); fbReqRef = null; }

  // Live request badge for admin
  if (currentRole === 'admin') {
    fbReqRef = firebase.database().ref('requests');
    fbReqRef.on('value', snap => {
      let count = 0;
      snap.forEach(child => { if (child.val().status === 'new') count++; });
      const badge = $('reqCount');
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  // Live badge for salesman — their own pending requests
  if (currentRole === 'salesman' && currentUser) {
    fbReqRef = firebase.database().ref('requests');
    fbReqRef.on('value', snap => {
      let count = 0;
      snap.forEach(child => {
        const r = child.val();
        if (r.status === 'new' && r.submittedByUid === currentUser.uid) count++;
      });
      const badge = $('reqCount');
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  if (VIEW_ONLY || currentRole === 'view-only') {
    fbRef.on('value', snapshot => {
      const fbData = snapshot.val();
      if (fbData) {
        try { applyStateData(fbData); } catch (e) { console.error('FB state error:', e); }
        try { render(); } catch (e) {}
        if (commentContext && $('commentBg').classList.contains('open')) {
          const d = getDayData(commentContext.dayKey);
          const job = d.jobs[commentContext.jobIdx];
          if (job) renderCommentList(job.comments || []);
        }
      }
      setSyncStatus('synced');
    }, () => setSyncStatus('offline'));
  } else {
    fbRef.on('value', snapshot => {
      const fbData = snapshot.val();
      if (fbData) {
        const localTs = state.lastModified || 0;
        const fbTs = fbData.lastModified || 0;
        if (fbTs > localTs) {
          const oldCounts = isFirstSchedSnap ? null : snapshotCommentCounts();
          const oldRevNums = isFirstSchedSnap ? null : Object.assign({}, state.revNums || {});
          const savedWeekStart = state.weekStart;
          const savedCurrentDay = currentDay;
          try { applyStateData(fbData); } catch (e) { console.error('FB state error:', e); }
          state.weekStart = savedWeekStart;
          currentDay = savedCurrentDay;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fbData));
          if (isFirstSchedSnap) {
            isFirstSchedSnap = false;
          } else {
            if (oldCounts) checkNewComments(oldCounts);
            if (oldRevNums) checkRevisionChanges(oldRevNums);
          }
          try { render(); } catch (e) {}
          if (commentContext && $('commentBg').classList.contains('open')) {
            const d = getDayData(commentContext.dayKey);
            const job = d.jobs[commentContext.jobIdx];
            if (job) renderCommentList(job.comments || []);
          }
        } else if (isFirstSchedSnap) {
          isFirstSchedSnap = false;
          try { render(); } catch (e) {}
        }
      }
      setSyncStatus('synced');
    }, () => setSyncStatus('offline'));
  }
}
