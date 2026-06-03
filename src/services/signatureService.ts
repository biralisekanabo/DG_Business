import crypto from 'crypto';

/**
 * Service de signature numérique
 * Signe les documents avec une clé privée et crée un tampon vérifié
 */

interface SignatureData {
  documentId: string;
  signataire: string;
  date: Date;
  signature: string;
  hash: string;
}

interface SignatureVerification {
  isValid: boolean;
  signataire: string;
  date: Date;
  message?: string;
}

class SignatureService {
  /**
   * Génère une clé privée/publique (à faire une seule fois)
   */
  static generateKeyPair() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    return { privateKey, publicKey };
  }

  /**
   * Signe un document avec la clé privée
   */
  static signDocument(
    content: string,
    signataire: string,
    privateKey: string
  ): SignatureData {
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    const signer = crypto.createSign('sha256');
    signer.update(content);
    const signature = signer.sign(privateKey, 'hex');

    return {
      documentId: crypto.randomBytes(16).toString('hex'),
      signataire,
      date: new Date(),
      signature,
      hash,
    };
  }

  /**
   * Vérifie la signature d'un document
   */
  static verifySignature(
    content: string,
    signatureData: SignatureData,
    publicKey: string
  ): SignatureVerification {
    try {
      const verifier = crypto.createVerify('sha256');
      verifier.update(content);
      const isValid = verifier.verify(publicKey, signatureData.signature, 'hex');

      // Vérifier aussi le hash
      const currentHash = crypto
        .createHash('sha256')
        .update(content)
        .digest('hex');
      const hashValid = currentHash === signatureData.hash;

      return {
        isValid: isValid && hashValid,
        signataire: signatureData.signataire,
        date: signatureData.date,
        message: isValid && hashValid ? 'Signature valide' : 'Signature invalide',
      };
    } catch (error) {
      return {
        isValid: false,
        signataire: signatureData.signataire,
        date: signatureData.date,
        message: `Erreur de vérification: ${error}`,
      };
    }
  }

  /**
   * Crée un tampon numérique pour le document
   */
  static createTimestamp(): {
    timestamp: number;
    isoDate: string;
    timestamp_hash: string;
  } {
    const now = Date.now();
    const isoDate = new Date(now).toISOString();
    const timestamp_hash = crypto
      .createHash('sha256')
      .update(isoDate)
      .digest('hex');

    return {
      timestamp: now,
      isoDate,
      timestamp_hash,
    };
  }

  /**
   * Crée un certificat numérique simple
   */
  static createCertificate(signataire: string, role: string) {
    return {
      id: crypto.randomUUID(),
      signataire,
      role,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
      fingerprint: crypto
        .createHash('sha256')
        .update(`${signataire}${role}${Date.now()}`)
        .digest('hex'),
    };
  }
}

export default SignatureService;
