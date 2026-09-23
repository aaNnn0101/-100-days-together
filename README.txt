# Firebase 2인 공유 버전

이 폴더는 Firebase Authentication(익명 로그인) + Cloud Firestore 기반의 2인 공유 웹앱입니다.

설정 순서
1. Firebase Console에서 새 프로젝트를 만듭니다.
2. 웹 앱을 추가하고 Firebase config를 복사합니다.
3. app.js의 firebaseConfig에 값을 붙여넣습니다.
4. Authentication > Sign-in method에서 Anonymous를 활성화합니다.
5. Firestore Database를 생성합니다.
6. Firestore Rules에 rules.txt 내용을 게시합니다.
7. 폴더 전체를 HTTPS로 호스팅합니다.

Firebase 공식 문서:
- 웹 앱 추가: https://firebase.google.com/docs/web/setup
- 익명 인증: https://firebase.google.com/docs/auth/web/anonymous-auth
- Firestore 보안 규칙: https://firebase.google.com/docs/firestore/security/get-started

주의: Firebase config 자체는 웹 앱에 포함되는 공개 설정값이지만, Firestore 보안 규칙은 반드시 설정해야 합니다.


현재 이 폴더의 app.js에는 Firebase 프로젝트 days-66f4e 연결 정보가 이미 들어 있습니다.
아이폰에서 웹호스팅 서비스를 이용해 이 폴더를 배포하면 친구와 링크를 공유할 수 있습니다.
