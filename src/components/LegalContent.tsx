import React from 'react';

export function AboutContent() {
  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Welcome to AstraScan ML</h3>
        <p>
          AstraScan ML is an AI-powered web application developed to support archaeological landscape analysis through the interpretation of satellite imagery. The platform combines modern geospatial technologies with artificial intelligence to assist archaeologists, GIS professionals, remote sensing specialists, heritage managers, researchers, and academic institutions in identifying potential archaeological and landscape features from remotely sensed imagery.
        </p>
        <p className="mt-2">
          Rather than replacing professional archaeological interpretation, AstraScan ML is designed to serve as a decision-support tool. By rapidly analyzing satellite images and highlighting areas of potential interest, the platform helps users prioritize locations for further investigation, field verification, and detailed scientific analysis.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">What AstraScan ML Does</h3>
        <p className="mb-2">The application enables users to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Upload satellite imagery for AI-assisted interpretation.</li>
          <li>Detect potential archaeological and landscape features.</li>
          <li>Compare historical and recent imagery to identify environmental and landscape changes.</li>
          <li>Process multiple images through batch analysis.</li>
          <li>Interactively inspect imagery using zoom and pan tools.</li>
          <li>Review previous analyses through a history log.</li>
          <li>Export interpretation results as professional PDF reports.</li>
        </ul>
        <p className="mt-2">
          Detected features may include archaeological earthworks, burial mounds, embankments, settlement patterns, agricultural features, water management structures, and other landscape anomalies visible in satellite imagery.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Artificial Intelligence</h3>
        <p className="mb-2">
          AstraScan ML utilizes Google's Gemini Multimodal AI to analyze uploaded imagery. The AI evaluates visual patterns and returns structured interpretations, feature descriptions, and approximate locations of detected anomalies.
        </p>
        <p>
          Because archaeological interpretation is inherently complex, AI-generated outputs should always be reviewed and validated by qualified professionals before being used for archaeological research, excavation planning, heritage management, or any other decision-making process.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Intended Users</h3>
        <p className="mb-2">AstraScan ML has been developed primarily for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Archaeologists</li>
          <li>GIS Analysts</li>
          <li>Remote Sensing Specialists</li>
          <li>Heritage Managers</li>
          <li>Researchers</li>
          <li>Academic Institutions</li>
          <li>Cultural Heritage Organizations</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Supported Image Formats</h3>
        <p className="mb-2">The application currently supports:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>GeoTIFF</li>
          <li>JPG</li>
          <li>PNG</li>
          <li>WebP</li>
        </ul>
        <p className="mt-2 text-slate-500 italic">Maximum upload size may be subject to system limitations.</p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Our Mission</h3>
        <p>
          Our mission is to make archaeological landscape interpretation more accessible, efficient, and data-driven by integrating artificial intelligence with geospatial analysis. AstraScan ML aims to improve documentation, encourage responsible archaeological research, and support the preservation of cultural heritage through innovative technology.
        </p>
      </div>

      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Important Notice</h3>
        <p>
          AstraScan ML is intended for research, educational, and professional support purposes. AI-generated interpretations are preliminary assessments and should not be considered definitive archaeological conclusions without appropriate expert review and field verification.
        </p>
      </div>
    </div>
  );
}

export function PrivacyContent() {
  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <p className="text-slate-500 italic">Effective Date: July 28, 2026</p>

      <p>
        AstraScan ML is committed to protecting the privacy of its users and handling information responsibly. This Privacy Policy explains how information is collected, used, stored, and protected when you use the application.
      </p>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Information We Collect</h3>
        <p className="mb-2">Depending on how you use AstraScan ML, the application may collect:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Account information (where user accounts are available).</li>
          <li>Uploaded satellite imagery.</li>
          <li>AI analysis requests and generated results.</li>
          <li>Technical information such as browser type, operating system, device information, and usage statistics.</li>
          <li>Error logs used to improve application performance.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">How We Use Your Information</h3>
        <p className="mb-2">Information collected may be used to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Process uploaded imagery.</li>
          <li>Generate AI-assisted interpretations.</li>
          <li>Produce downloadable reports.</li>
          <li>Improve application functionality and user experience.</li>
          <li>Diagnose technical issues and maintain system security.</li>
          <li>Support research and software development.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Artificial Intelligence Processing</h3>
        <p className="mb-2">
          When users request image interpretation, uploaded imagery may be processed by third-party artificial intelligence services that provide the analytical capabilities used by AstraScan ML.
        </p>
        <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200">
          <p>Users should avoid uploading imagery containing confidential, sensitive, or legally restricted information unless they have the necessary authorization to do so.</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Data Storage & Security</h3>
        <p className="mb-2">
          Uploaded data and generated results may be stored temporarily or for a limited period to enable application functionality, user history, and report generation, depending on system configuration.
        </p>
        <p>
          Reasonable technical and organizational measures are implemented to protect user information against unauthorized access, alteration, disclosure, or destruction. However, no internet-based system can guarantee absolute security.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Third-Party Services</h3>
        <p>
          AstraScan ML may rely on trusted third-party technologies and services for application functionality, including artificial intelligence processing and cloud infrastructure. These providers operate under their own privacy practices.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">User Responsibilities & Intellectual Property</h3>
        <ul className="list-disc pl-5 space-y-2 mb-4">
          <li>Users are responsible for ensuring they have the legal right to upload any imagery submitted to the application.</li>
          <li>Users should verify all AI-generated interpretations before relying on them for archaeological, environmental, legal, engineering, or heritage management decisions.</li>
        </ul>
        <p>
          Users retain ownership of the imagery they upload unless otherwise agreed. AI-generated interpretations are provided as analytical assistance and should be independently evaluated before publication or professional use.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">Changes & Contact</h3>
        <p className="mb-2">
          This Privacy Policy may be updated periodically to reflect improvements to the application, changes in applicable laws, or operational requirements. The latest version will always be made available within the application.
        </p>
        <p>
          For questions regarding this Privacy Policy or the operation of AstraScan ML, please contact the application administrator or development team through the official communication channels provided within the application: <a href="mailto:urnaceventure@gmail.com" className="text-blue-600 hover:underline">urnaceventure@gmail.com</a>
        </p>
      </div>
    </div>
  );
}

export function TermsContent() {
  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <p className="text-slate-500 italic">Effective Date: July 28, 2026</p>

      <p>
        Welcome to AstraScan ML ("the Application", "the Service", "we", "our", or "us"). These Terms of Service ("Terms") govern your access to and use of AstraScan ML. By accessing or using the Service, you agree to be bound by these Terms. If you do not agree with these Terms, you must discontinue use of the Service.
      </p>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">1. About AstraScan ML</h3>
        <p>
          AstraScan ML is an AI-powered web application designed to assist users in the interpretation of satellite imagery for archaeological landscape analysis. The platform provides AI-assisted image interpretation and analytical tools intended to support archaeological research, heritage management, geospatial analysis, and related scientific activities.
        </p>
        <p className="mt-2">
          The Service is intended to complement—not replace—the expertise and judgment of qualified professionals.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">2. Eligibility</h3>
        <p className="mb-2">By using AstraScan ML, you represent and warrant that:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>You are legally capable of entering into a binding agreement.</li>
          <li>You will comply with all applicable laws and regulations.</li>
          <li>You have the authority to upload and analyze any imagery or data submitted through the Service.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">3. User Accounts</h3>
        <p className="mb-2">Where user registration is available, you are responsible for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Maintaining the confidentiality of your account credentials.</li>
          <li>Ensuring the accuracy of your account information.</li>
          <li>All activities conducted under your account.</li>
          <li>Promptly notifying us of any unauthorized access or suspected security breach.</li>
        </ul>
        <p className="mt-2">We reserve the right to suspend or terminate accounts that violate these Terms.</p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">4. Acceptable Use</h3>
        <p className="mb-2">You agree to use AstraScan ML only for lawful purposes. You must not:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Upload unlawful, harmful, fraudulent, or malicious content.</li>
          <li>Upload imagery or datasets that you do not have permission to use.</li>
          <li>Attempt to interfere with or disrupt the operation or security of the Service.</li>
          <li>Reverse engineer, exploit, or attempt unauthorized access to the platform.</li>
          <li>Use the Service to violate intellectual property rights or applicable laws.</li>
          <li>Introduce malware, viruses, automated attacks, or malicious software.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">5. User Content</h3>
        <p className="mb-2">You retain ownership of all imagery, datasets, and other content that you upload to AstraScan ML.</p>
        <p className="mb-2">
          By submitting content to the Service, you grant AstraScan ML a non-exclusive license to process, analyze, store (where applicable), and display your content solely for the purpose of providing the requested functionality.
        </p>
        <p>You are solely responsible for ensuring that your uploaded content does not infringe the rights of any third party.</p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">6. Artificial Intelligence Disclaimer</h3>
        <p className="mb-2">AstraScan ML utilizes artificial intelligence to assist with satellite imagery interpretation.</p>
        <p className="mb-2">AI-generated outputs are probabilistic and may contain inaccuracies, omissions, or incorrect interpretations.</p>
        <p className="mb-2">The Service does not guarantee the accuracy, completeness, or reliability of AI-generated analyses.</p>
        <p>
          Users should independently verify all AI-generated interpretations before relying on them for archaeological investigations, heritage management, engineering, environmental assessments, legal matters, research publications, or any other professional decision-making.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">7. Intellectual Property</h3>
        <p className="mb-2">
          Unless otherwise stated, AstraScan ML, including its software, interface, design, documentation, trademarks, logos, and original content, is protected by applicable intellectual property laws.
        </p>
        <p>These Terms do not grant users ownership of the Application or its underlying technology.</p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">8. Third-Party Services</h3>
        <p className="mb-2">
          The Service may rely on third-party technologies, cloud providers, artificial intelligence services, mapping platforms, or open-source software.
        </p>
        <p className="mb-2">We are not responsible for the availability, performance, or policies of third-party services.</p>
        <p>Use of such services may also be subject to their respective terms and policies.</p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">9. Service Availability</h3>
        <p className="mb-2">
          We strive to maintain reliable access to AstraScan ML but do not guarantee uninterrupted or error-free operation.
        </p>
        <p>
          Maintenance, software updates, technical failures, internet outages, or circumstances beyond our reasonable control may temporarily affect availability.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">10. Data Security</h3>
        <p className="mb-2">
          We implement reasonable administrative, technical, and organizational measures designed to protect user information.
        </p>
        <p>
          However, no online service can guarantee absolute security, and users acknowledge that they use the Service at their own risk.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">11. Privacy</h3>
        <p className="mb-2">
          Your use of AstraScan ML is also governed by our Privacy Policy, which explains how information is collected, used, stored, and protected.
        </p>
        <p>By using the Service, you acknowledge that you have read and understood the Privacy Policy.</p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">12. Research and Educational Use</h3>
        <p className="mb-2">
          AstraScan ML may be used for research, education, heritage documentation, and professional analysis.
        </p>
        <p className="mb-2">
          The Application should not be relied upon as the sole basis for excavation planning, legal determinations, governmental decisions, emergency response, or any activity where inaccurate results could cause harm or significant loss.
        </p>
        <p>Professional judgment and field verification remain essential.</p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">13. Limitation of Liability</h3>
        <p className="mb-2">
          To the fullest extent permitted by applicable law, AstraScan ML, its developers, contributors, partners, and affiliates shall not be liable for any direct, indirect, incidental, consequential, special, or punitive damages arising from or related to:
        </p>
        <ul className="list-disc pl-5 space-y-1 mb-2">
          <li>Use or inability to use the Service.</li>
          <li>AI-generated interpretations or analytical results.</li>
          <li>Loss of data, revenue, profits, or business opportunities.</li>
          <li>Decisions made based on outputs generated by the Service.</li>
          <li>Service interruptions or technical failures.</li>
        </ul>
        <p>Users assume full responsibility for evaluating and verifying all outputs before use.</p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">14. Indemnification</h3>
        <p className="mb-2">
          You agree to indemnify and hold harmless AstraScan ML, its developers, affiliates, contributors, and partners from any claims, damages, liabilities, costs, or expenses arising from:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your misuse of the Service.</li>
          <li>Your violation of these Terms.</li>
          <li>Your infringement of any third-party rights.</li>
          <li>Content uploaded or submitted by you.</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">15. Suspension and Termination</h3>
        <p>
          We reserve the right to suspend or terminate access to the Service, with or without notice, where users violate these Terms, misuse the platform, compromise system security, or engage in unlawful conduct.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">16. Changes to These Terms</h3>
        <p className="mb-2">
          We may revise these Terms periodically to reflect updates to the Service, legal requirements, or operational changes.
        </p>
        <p>
          Updated Terms will become effective upon publication within the Application. Continued use of AstraScan ML after revisions constitutes acceptance of the updated Terms.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">17. Governing Law</h3>
        <p>
          These Terms shall be governed by and interpreted in accordance with the applicable laws of the jurisdiction in which the operator of AstraScan ML is established, unless otherwise required by applicable law.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">18. Contact</h3>
        <p>
          If you have questions regarding these Terms of Service or the operation of AstraScan ML, please contact the application administrator through the official communication channels provided within the Application.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-2">19. Entire Agreement</h3>
        <p>
          These Terms of Service, together with the Privacy Policy and any additional policies published within AstraScan ML, constitute the entire agreement between you and AstraScan ML regarding your use of the Service.
        </p>
      </div>

      <div className="bg-slate-100 p-4 rounded-lg text-center mt-8">
        <p className="font-medium text-slate-700">
          By accessing or using AstraScan ML, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
        </p>
      </div>
    </div>
  );
}
