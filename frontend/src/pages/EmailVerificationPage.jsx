import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const EmailVerificationPage = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('No verification token provided');
                return;
            }

            try {
                const response = await api.get(`/auth/verify-email?token=${token}`);
                setStatus('success');
                setMessage(response.data.message);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.error || 'Verification failed');
            }
        };

        verifyEmail();
    }, [searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="card max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <Loader className="h-16 w-16 text-primary-600 mx-auto mb-4 animate-spin" />
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            Verifying Your Email
                        </h2>
                        <p className="text-slate-600">Please wait...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            Email Verified!
                        </h2>
                        <p className="text-slate-600 mb-6">{message}</p>
                        <Link to="/login" className="btn-primary inline-block">
                            Go to Login
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                            <XCircle className="h-10 w-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            Verification Failed
                        </h2>
                        <p className="text-slate-600 mb-6">{message}</p>
                        <Link to="/register" className="btn-primary inline-block">
                            Register Again
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default EmailVerificationPage;
